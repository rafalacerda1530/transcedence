import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameDto } from 'src/dto/game.dto';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    },
    namespace: 'game',
})

@Injectable()
export class GameGatewayService implements OnGatewayConnection, OnGatewayDisconnect{
	constructor(
        private config: ConfigService,
    ) {}

    private games = new Map<string, GameDto>();
    private players = new Map<string, string>();

    @WebSocketServer() server: Server;

    @SubscribeMessage('moveUp')
    handleMoveUp(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        const game = this.games.get(data.roomId);
        if (game.player1 === client.id && game.paddle1Y > 24) {
            game.paddle1Y -= 1;
        }
        else if (game.player2 === client.id && game.paddle2Y > 24) {
            game.paddle2Y -= 1;
        }
        this.games.set(data.roomId, game);
        this.server.to(data.roomId).emit('moveUp', { game: this.games.get(data.roomId) });
        return ;
    }

    @SubscribeMessage('moveDown')
    handleMoveDown(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        const game = this.games.get(data.roomId);
        if (game.player1 === client.id && game.paddle1Y < 65) {
            game.paddle1Y += 1;
        }
        else if (game.player2 === client.id && game.paddle2Y < 65) {
            game.paddle2Y += 1;
        }
        this.games.set(data.roomId, game);
        this.server.to(data.roomId).emit('moveDown', { game: this.games.get(data.roomId) });
        return ;
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        if (!client.handshake.headers.cookie) {
            client.disconnect();
            return;
        }
        const token = client.handshake.headers.cookie.split('=')[1];
        const end = token.indexOf(';');
        const result = token.substring(0, end);
        try {
            const decoded = jwt.verify(
                result,
                this.config.get('JWT_SECRET_ACCESS'),
            );
            if (!this.games.has(data.roomId)) {
                const game = new GameDto(data.roomId);
                game.player1 = client.id;
                if (typeof decoded['sub'] === 'string') {
                    game.player1Name = decoded['sub'];
                }
                client.join(data.roomId);
                this.players.set(client.id, data.roomId);
                this.games.set(data.roomId, game);
            }
            else{
                client.join(data.roomId);
                const game = this.games.get(data.roomId);
                if (game.player2 === ""){
                    game.player2 = client.id;
                    if (typeof decoded['sub'] === 'string') {
                        game.player2Name = decoded['sub'];
                    }
                    this.games.set(data.roomId, game);
                    this.players.set(client.id, data.roomId);
                    this.server.to(data.roomId).emit('gameSet', { game: this.games.get(data.roomId) });
                }
            }
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                console.log('JWT expired');
                client.emit('jwt_error', { message: 'JWT expired' });
            }
            client.disconnect();
            return;
        }
        return ;
    }

    @SubscribeMessage('startGame')
    handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() data: any){
        if (this.games.has(data.roomId)) {
            const game = this.games.get(data.roomId);
            if (game.player1 === client.id || game.player2 === client.id)
                game.ready++;
            if (game.ready === 2) {
                this.startGameLoop(data.roomId);
            }
        }
    }

    startGameLoop(roomId: string) {
        const game = this.games.get(roomId);
        if (!game)
            return;

        const loop = () => {
            if (game.score1 === 5 || game.score2 === 5) {
                if (game.score1 === 5)
                    this.server.to(roomId).emit('winner', { winner: game.player1Name });
                else if (game.score2 === 5)
                    this.server.to(roomId).emit('winner', { winner: game.player2Name });
                return;
            }
            game.update();
            this.games.set(roomId, game);
            this.server.to(roomId).emit('update', { game: this.games.get(roomId) });
            setTimeout(loop, 1000 / 60);
        };
        loop();
        return ;
    }

    handleConnection(@ConnectedSocket() client: Socket){
        if (!client.handshake.headers.cookie) {
            client.disconnect();
            return;
        }
        const token = client.handshake.headers.cookie.split('=')[1];
        const end = token.indexOf(';');
        const result = token.substring(0, end);
        try {
            jwt.verify(
                result,
                this.config.get('JWT_SECRET_ACCESS'),
            );
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                console.log('JWT expired');
                client.emit('jwt_error', { message: 'JWT expired' });
            }
            client.disconnect();
            return;
        }
        return ;
     }

     handleDisconnect(@ConnectedSocket() client: Socket){
        if (this.players.has(client.id)) {
            const roomId = this.players.get(client.id);
            this.players.delete(client.id);
            client.leave(roomId);
            if (this.games.has(roomId)) {
                const game = this.games.get(roomId);
                if (game.player1 === client.id) {
                    this.server.to(roomId).emit('winner', { winner: game.player2Name });
                }
                else if (game.player2 === client.id) {
                    this.server.to(roomId).emit('winner', { winner: game.player1Name });
                }
                this.games.delete(roomId);
            }
        }
        return ;
     }
}
