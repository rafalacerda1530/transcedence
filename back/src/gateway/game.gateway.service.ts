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

interface GameDto {
    player1Name: string;
    player2Name: string;
    paddle1Y: number;
    paddle2Y: number;
    ballX: number;
    ballY: number;
    score1: number;
    score2: number;
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
    private players = new Map<string, string>();

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

    createGameDto(game: Game): GameDto {
        return {
            player1Name: game.player1Name,
            player2Name: game.player2Name,
            paddle1Y: game.paddle1Y,
            paddle2Y: game.paddle2Y,
            ballX: game.ballX,
            ballY: game.ballY,
            score1: game.score1,
            score2: game.score2,
        };
    }

    movePaddleUp(game: any, paddle: string): any {
        if (game[`${paddle}Y`] > 24) {
            if (game[`${paddle}SpeedY`] > 0) {
                game[`${paddle}SpeedY`] = 0;
            } else {
                game[`${paddle}Y`] -= 2.0 - game[`${paddle}SpeedY`];
                game[`${paddle}SpeedY`] -= 0.3;
                if (game[`${paddle}Y`] <= 24) {
                    game[`${paddle}SpeedY`] = 0;
                    game[`${paddle}Y`] = 24;
                }
            }
        }
        return game;
    }

    @SubscribeMessage('moveUp')
    handleMoveUp(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        let game = this.games.get(data.roomId);

        if (!game) return;
        if (game.player1 === client.id) {
            game = this.movePaddleUp(game, 'paddle1');
        } else if (game.player2 === client.id) {
            game = this.movePaddleUp(game, 'paddle2');
        }
        this.games.set(data.roomId, game);
		const gameDto = this.createGameDto(game);
        this.server.to(data.roomId).emit('moveUp', { game: gameDto });
    }

    movePaddleDown(game: any, paddle: string): any {
        if (game[`${paddle}Y`] < 65) {
            if (game[`${paddle}SpeedY`] < 0) {
                game[`${paddle}SpeedY`] = 0;
            } else {
                game[`${paddle}Y`] += 2.0 + game[`${paddle}SpeedY`];
                game[`${paddle}SpeedY`] += 0.3;
                if (game[`${paddle}Y`] >= 65) {
                    game[`${paddle}SpeedY`] = 0;
                    game[`${paddle}Y`] = 65;
                }
            }
        }
        return game;
    }

    @SubscribeMessage('moveDown')
    handleMoveDown(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        let game = this.games.get(data.roomId);

        if (!game) return;
        if (game.player1 === client.id) {
            game = this.movePaddleDown(game, 'paddle1');
        } else if (game.player2 === client.id) {
            game = this.movePaddleDown(game, 'paddle2');
        }

        this.games.set(data.roomId, game);
		const gameDto = this.createGameDto(game);
        this.server.to(data.roomId).emit('moveDown', { game: gameDto });
    }

    stopPaddle(game: any, paddle: string): any {
        game[`${paddle}SpeedY`] = 0;
        return game;
    }

    @SubscribeMessage('moveStop')
    handleMoveStop(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        let game = this.games.get(data.roomId);

        if (!game) return;
        if (game.player1 === client.id) {
            game = this.stopPaddle(game, 'paddle1');
        } else if (game.player2 === client.id) {
            game = this.stopPaddle(game, 'paddle2');
        }
        this.games.set(data.roomId, game);
    }

    createGame(client: Socket, data: any, decoded: any): void {
        const game = new Game(data.roomId);
        game.player1 = client.id;
        if (typeof decoded['sub'] === 'string') {
            game.player1Name = decoded['sub'];
        }
        client.join(data.roomId);
        this.players.set(client.id, data.roomId);
        this.games.set(data.roomId, game);
    }

    joinGame(client: Socket, data: any, decoded: any): void {
        const game = this.games.get(data.roomId);
        if (game.player1Name === decoded['sub']) {
            this.server.sockets.sockets[game.player1].leave(data.roomId);
            game.player1 = client.id;
            if (typeof decoded['sub'] === 'string') {
                game.player1Name = decoded['sub'];
            }
            this.games.set(data.roomId, game);
            this.players.set(client.id, data.roomId);
        } else {
            client.join(data.roomId);
            if (game.player2 === "") {
                game.player2 = client.id;
                if (typeof decoded['sub'] === 'string') {
                    game.player2Name = decoded['sub'];
                }
                this.games.set(data.roomId, game);
                this.players.set(client.id, data.roomId);
				const gameDto: GameDto = {
			player1Name: game.player1Name,
			player2Name: game.player2Name,
			paddle1Y: game.paddle1Y,
			paddle2Y: game.paddle2Y,
			ballX: game.ballX,
			ballY: game.ballY,
			score1: game.score1,
			score2: game.score2,
		};
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
            return ;
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
        if (![player1User] || !player2User) return ;
        await this.prismaCommands.addGame(player1User, player2User, game);

    }

    async asyncEndGame(game: Game, roomId: string, winnerName: string) {
        const player1 = game.player1Name;
        const player2 = game.player2Name;
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
                return ;
            }
            if (game.score1 === 5) {
                this.asyncEndGame(game, roomId, game.player1Name);
                return ;
            } else if (game.score2 === 5) {
                this.asyncEndGame(game, roomId, game.player2Name);
                return ;
            }
            game.update();
            this.games.set(roomId, game);
			const gameDto: GameDto = {
			player1Name: game.player1Name,
			player2Name: game.player2Name,
			paddle1Y: game.paddle1Y,
			paddle2Y: game.paddle2Y,
			ballX: game.ballX,
			ballY: game.ballY,
			score1: game.score1,
			score2: game.score2,
		};
            this.server.to(roomId).emit('update', { game: gameDto });
            setTimeout(loop, 1000 / 60);
        };
        loop();
        return;
    }

    @SubscribeMessage('startGame')
    handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        const game = this.games.get(data.roomId);
        if (!game) return ;
        if (game.player1 === client.id || game.player2 === client.id)
            game.ready++;
        if (game.ready === 2) {
            this.startGameLoop(data.roomId);
        }
    }

    handleConnection(@ConnectedSocket() client: Socket) {
        const token = this.getTokenFromCookie(client);
        try {
            jwt.verify(token, this.config.get('JWT_SECRET_ACCESS'));
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                this.emitErrorAndDisconnect(client, 'JWT expired', 'jwt_error');
            } else {
                client.disconnect();
            }
            return ;
        }
    }

    handlePlayerDisconnect(game: Game, roomId: string, winnerName: string, score1: number, score2: number) {
        game.score1 = score1;
        game.score2 = score2;
        this.games.set(roomId, game);
        const gameDto: GameDto = this.createGameDto(game);
        this.server.to(roomId).emit('update', { game: gameDto });
        this.server.to(roomId).emit('opponentLogout');
        this.asyncEndGame(game, roomId, winnerName);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        const roomId = this.players.get(client.id);
        if (!roomId) return;
        this.players.delete(client.id);
        client.leave(roomId);
        const game = this.games.get(roomId);
        if (!game) return;
        if (game.player1 === client.id) {
            this.handlePlayerDisconnect(game, roomId, game.player2Name, 0, 5);
        } else if (game.player2 === client.id) {
            this.handlePlayerDisconnect(game, roomId, game.player1Name, 5, 0);
        }
    }
}
