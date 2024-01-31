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
import { Game } from 'src/game/game';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaCommands } from 'src/prisma/prisma.commands';
import { StickBallMode } from 'src/game/stickBall';
import { UserStatus } from '@prisma/client';
import { use } from 'passport';

class UserData {
    username: string;
    roomId: string;
}

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    },
    namespace: 'game',
})

@Injectable()
export class GameGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private config: ConfigService,
        private prismaCommands: PrismaCommands,
        private prisma: PrismaService,
    ) { }

    private games = new Map<string, Game>();
    private players = new Map<string, UserData>();

    @WebSocketServer() server: Server;

    emitErrorAndDisconnect(client: Socket, message: string, event: string) {
        console.log(message);
        client.emit(event, { message });
        client.disconnect();
    }

    getTokenFromCookie(client: Socket): string | null {
        if (!client.handshake.headers.cookie) {
            return null;
        }
        const token = client.handshake.headers.cookie.split('accessToken=')[1];
        if (!token) {
            return null;
        }
        const end = token.indexOf(';');
        return end == -1 ? token : token.substring(0, end);
    }

    @SubscribeMessage('releaseBall')
    handleReleaseBall(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        let game = this.games.get(data.roomId);
        if (!game) return;
        if (game.gameMode instanceof StickBallMode) {
            game.gameMode.releaseBall(client.id);
        }
    }

    movePaddleUp(game: any, paddle: string): any {
        if (game.gameMode[`${paddle}Y`] > 24) {
            if (game.gameMode[`${paddle}SpeedY`] > 0) {
                game.gameMode[`${paddle}SpeedY`] = 0;
            } else {
                game.gameMode[`${paddle}Y`] -= 2.0 - game.gameMode[`${paddle}SpeedY`];
                game.gameMode[`${paddle}SpeedY`] -= 0.3;
                if (game.gameMode[`${paddle}Y`] <= 24) {
                    game.gameMode[`${paddle}SpeedY`] = 0;
                    game.gameMode[`${paddle}Y`] = 24;
                }
            }
        }
        return game;
    }

    @SubscribeMessage('moveUp')
    handleMoveUp(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        let game = this.games.get(data.roomId);

        if (!game) return;
        if (game.gameMode.player1 === client.id) {
            game = this.movePaddleUp(game, 'paddle1');
        } else if (game.gameMode.player2 === client.id) {
            game = this.movePaddleUp(game, 'paddle2');
        }
        this.games.set(data.roomId, game);
        const gameDto = game.gameMode.createGameDto();
        this.server.to(data.roomId).emit('moveUp', { game: gameDto });
    }

    movePaddleDown(game: any, paddle: string): any {
        if (game.gameMode[`${paddle}Y`] < 65) {
            if (game.gameMode[`${paddle}SpeedY`] < 0) {
                game.gameMode[`${paddle}SpeedY`] = 0;
            } else {
                game.gameMode[`${paddle}Y`] += 2.0 + game.gameMode[`${paddle}SpeedY`];
                game.gameMode[`${paddle}SpeedY`] += 0.3;
                if (game.gameMode[`${paddle}Y`] >= 65) {
                    game.gameMode[`${paddle}SpeedY`] = 0;
                    game.gameMode[`${paddle}Y`] = 65;
                }
            }
        }
        return game;
    }

    @SubscribeMessage('moveDown')
    handleMoveDown(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        let game = this.games.get(data.roomId);

        if (!game) return;
        if (game.gameMode.player1 === client.id) {
            game = this.movePaddleDown(game, 'paddle1');
        } else if (game.gameMode.player2 === client.id) {
            game = this.movePaddleDown(game, 'paddle2');
        }

        this.games.set(data.roomId, game);
        const gameDto = game.gameMode.createGameDto();
        this.server.to(data.roomId).emit('moveDown', { game: gameDto });
    }

    stopPaddle(game: any, paddle: string): any {
        game.gameMode[`${paddle}SpeedY`] = 0;
        return game;
    }

    @SubscribeMessage('moveStop')
    handleMoveStop(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        let game = this.games.get(data.roomId);

        if (!game) return;
        if (game.gameMode.player1 === client.id) {
            game = this.stopPaddle(game, 'paddle1');
        } else if (game.gameMode.player2 === client.id) {
            game = this.stopPaddle(game, 'paddle2');
        }
        this.games.set(data.roomId, game);
    }

    createGame(client: Socket, data: any, decoded: any): void {
        const game = new Game(data.roomId, data.mode);
        let userData: UserData = { username: "", roomId: "" };
        game.gameMode.player1 = client.id;
        if (typeof decoded['sub'] === 'string') {
            userData = { username: decoded['sub'], roomId: data.roomId };
            game.gameMode.player1Name = decoded['sub'];
        }
        client.join(data.roomId);
        this.players.set(client.id, userData);
        this.games.set(data.roomId, game);
    }

    joinGame(client: Socket, data: any, decoded: any): void {
        const game = this.games.get(data.roomId);
        if (game.gameMode.player1Name === decoded['sub']) {
            this.server.sockets.sockets[game.gameMode.player1].leave(data.roomId);
            game.gameMode.player1 = client.id;
            let userData: UserData = { username: "", roomId: "" };
            if (typeof decoded['sub'] === 'string') {
                game.gameMode.player1Name = decoded['sub'];
                userData = { username: decoded['sub'], roomId: data.roomId };
            }
            this.games.set(data.roomId, game);
            this.players.set(client.id, userData);
        } else {
            client.join(data.roomId);
            if (game.gameMode.player2 === "") {
                game.gameMode.player2 = client.id;
                let userData: UserData = { username: "", roomId: "" };
                if (typeof decoded['sub'] === 'string') {
                    game.gameMode.player2Name = decoded['sub'];
                    userData = { username: decoded['sub'], roomId: data.roomId };
                }
                this.games.set(data.roomId, game);
                this.players.set(client.id, userData);
                const gameDto = game.gameMode.createGameDto();
                this.server.to(data.roomId).emit('gameSet', { game: gameDto });
            }
        }
    }

    handleGameJoining(client: Socket, data: any, decoded: any): void {
        if (!this.games.has(data.roomId)) {
            this.createGame(client, data, decoded);
        } else {
            this.joinGame(client, data, decoded);
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        const token = this.getTokenFromCookie(client);
        if (!token) {
            this.emitErrorAndDisconnect(client, 'Missing Token', 'missing_token');
            return;
        }
        try {
            const decoded = jwt.verify(token, this.config.get('JWT_SECRET_ACCESS'));
            this.handleGameJoining(client, data, decoded);
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                this.emitErrorAndDisconnect(client, 'JWT expired', 'jwt_error');
            }
        }
    }

    async addGameDatabase(game: Game, roomId: string, player1: string, player2: string) {
        const player1User = await this.prisma.user.findUnique({
            where: {
                user: player1,
            },
        });
        const player2User = await this.prisma.user.findUnique({
            where: {
                user: player2,
            },
        });
        if (![player1User] || !player2User) return;
        await this.prismaCommands.addGame(player1User, player2User, game);
    }

    async asyncEndGame(game: Game, roomId: string, winnerName: string) {
        const player1 = game.gameMode.player1Name;
        const player2 = game.gameMode.player2Name;
        this.server.to(roomId).emit('winner', { winner: winnerName });
        this.games.delete(roomId);
        await this.addGameDatabase(game, roomId, player1, player2);
    }

    startGameLoop(roomId: string) {
        const game = this.games.get(roomId);
        if (!game)
            return;

        const loop = async () => {
            if (!this.games.has(roomId)) {
                return;
            }
            if (game.gameMode.score1 === 5) {
                this.asyncEndGame(game, roomId, game.gameMode.player1Name);
                return;
            } else if (game.gameMode.score2 === 5) {
                this.asyncEndGame(game, roomId, game.gameMode.player2Name);
                return;
            }
            game.gameMode.update();
            this.games.set(roomId, game);
            const gameDto = game.gameMode.createGameDto();
            this.server.to(roomId).emit('update', { game: gameDto });
            setTimeout(loop, 1000 / 60);
        };
        loop();
        return;
    }

    @SubscribeMessage('startGame')
    handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        const game = this.games.get(data.roomId);
        if (!game) return;
        if (game.gameMode.player1 === client.id || game.gameMode.player2 === client.id)
            game.gameMode.ready++;
        if (game.gameMode.ready === 2) {
            this.startGameLoop(data.roomId);
        }
    }

    handleConnection(@ConnectedSocket() client: Socket) {
        const token = this.getTokenFromCookie(client);
        try {
            const decoded = jwt.verify(token, this.config.get('JWT_SECRET_ACCESS'));
            if (typeof decoded['sub'] === 'string'){
                this.prismaCommands.updateUserStatus(decoded['sub'], UserStatus.IN_GAME);
                let userData: UserData = { username: "", roomId: "" };
                userData = { username: decoded['sub'], roomId: "" };
                this.players.set(client.id, userData);
            }
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                this.emitErrorAndDisconnect(client, 'JWT expired', 'jwt_error');
            } else {
                client.disconnect();
            }
            return;
        }
    }

    handlePlayerDisconnect(game: Game, roomId: string, winnerName: string, score1: number, score2: number) {
        game.gameMode.score1 = score1;
        game.gameMode.score2 = score2;
        this.games.set(roomId, game);
        const gameDto = game.gameMode.createGameDto();
        this.server.to(roomId).emit('update', { game: gameDto });
        this.server.to(roomId).emit('opponentLogout');
        this.asyncEndGame(game, roomId, winnerName);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        const userData = this.players.get(client.id);
        if (!userData) return;
        this.players.delete(client.id);
        client.leave(userData.roomId);
        this.prismaCommands.updateUserStatus(userData.username, UserStatus.OFFLINE);
        const game = this.games.get(userData.roomId);
        if (!game) return;
        if (game.gameMode.player1 === client.id) {
            this.handlePlayerDisconnect(game, userData.roomId, game.gameMode.player2Name, 0, 5);
        } else if (game.gameMode.player2 === client.id) {
            this.handlePlayerDisconnect(game, userData.roomId, game.gameMode.player1Name, 5, 0);
        }
    }
}
