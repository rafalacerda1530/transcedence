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
import { Game } from 'src/dto/games';

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

    private games = new Map<string, Game>();

    @WebSocketServer() server: Server;

    @SubscribeMessage('moveUp')
    handleMoveUp(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        console.log('moveUp');
        console.log(client.id);
        console.log(data.roomId);
        client.to(data.roomId).emit('moveUp', { message: 'moveUp' });
        return ;
    }

    @SubscribeMessage('moveDown')
    handleMoveDown(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        console.log('moveDown');
        client.to(data.roomId).emit('moveDown', { message: 'moveUp' });
        return ;
    }

    @SubscribeMessage('quitGame')
    handleQuitGame(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        console.log('Deleting Game');
        this.games.delete(data.roomId);
        return ;
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        console.log(data);
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
            console.log(decoded);
            if (!this.games.has(data.roomId)) {
                const game = new Game(data.roomId);
                game.player1 = client.id;
                if (typeof decoded['sub'] === 'string') {
                    game.player1Name = decoded['sub'];
                }
                this.games.set(data.roomId, game);
                client.join(data.roomId);
            }
            else{
                const game = this.games.get(data.roomId);
                game.player2 = client.id;
                if (typeof decoded['sub'] === 'string') {
                    game.player2Name = decoded['sub'];
                }
                this.games.set(data.roomId, game);
                client.join(data.roomId);
                this.server.to(data.roomId).emit('gameSet', { game: this.games.get(data.roomId) });
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
     }
}
