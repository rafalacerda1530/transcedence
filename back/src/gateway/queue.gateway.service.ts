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
import { PrismaCommands } from 'src/prisma/prisma.commands';
import { UserStatus } from '@prisma/client';

interface UserData {
    username: string;
    socketId: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.REACT_APP_WEB_URL,
        credentials: true,
    },
    namespace: 'queue',
})
@Injectable()
export class QueueGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private config: ConfigService,
        private prismaCommands: PrismaCommands,
    ) { }

    @WebSocketServer() server: Server;
    private normalQueue: UserData[] = [];
    private hardQueue: UserData[] = [];
    private stickQueue: UserData[] = [];
    private players = new Map<string, string>();

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

    getQueue(gameMode: string): UserData[] {
        switch (gameMode) {
            case 'normal':
                return this.normalQueue;
            case 'hard':
                return this.hardQueue;
            case 'stick':
                return this.stickQueue;
            default:
                return [];
        }
    }

    removeFromOtherQueues(clientId: string, queue: UserData[]) {
        const otherQueues = [this.normalQueue, this.hardQueue, this.stickQueue].filter(q => q !== queue);
        for (const otherQueue of otherQueues) {
            const index = otherQueue.findIndex(user => user.socketId === clientId);
            if (index !== -1) {
                otherQueue.splice(index, 1);
            }
        }
    }

    @SubscribeMessage('joinQueue')
    handleJoinQueue(@ConnectedSocket() client: Socket, @MessageBody() data: { gameModes: string[] }): string {
        const token = this.getTokenFromCookie(client);
        if (!token) {
            this.emitErrorAndDisconnect(client, 'Missing Token', 'missing_token');
            return;
        }
        try {
            const decoded = jwt.verify(
                token,
                this.config.get('JWT_SECRET_ACCESS'),
            );
            const player = { username: decoded['sub'], socketId: client.id };
            const userData = player as UserData;

            for (const gameMode of data.gameModes) {
                const queue = this.getQueue(gameMode);

                if (queue.length > 0) {
                    const opponent = queue.shift();
                    this.server.to(client.id).emit('joinGame', { message: 'Found opponent!', roomId: opponent.socketId + client.id, mode: gameMode});
                    this.server.to(opponent.socketId).emit('joinGame', { message: 'Found opponent!', roomId: opponent.socketId + client.id, mode: gameMode});
                    this.removeFromOtherQueues(client.id, queue);
                    return;
                }

                queue.push(userData);
            }
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                this.emitErrorAndDisconnect(client, 'JWT expired', 'jwt_error');;
            }
            client.disconnect();
            return;
        }
        return;
    }

    handleConnection(@ConnectedSocket() client: Socket) {
        const token = this.getTokenFromCookie(client);
        if (!token) {
            this.emitErrorAndDisconnect(client, 'Missing Token', 'missing_token');
            return;
        }
        try {
            const decoded = jwt.verify(
                token,
                this.config.get('JWT_SECRET_ACCESS'),
            );
            if (typeof decoded['sub'] === 'string'){
                this.prismaCommands.updateUserStatus(decoded['sub'], UserStatus.IN_QUEUE);
                this.players.set(client.id, decoded['sub']);
            }
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                this.emitErrorAndDisconnect(client, 'JWT expired', 'jwt_error');
            }
            client.disconnect();
            return;
        }
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        const queues = [this.normalQueue, this.hardQueue, this.stickQueue];
        for (const queue of queues) {
            const user = queue.find(user => user.socketId === client.id);
            if (user) {
                queue.splice(queue.indexOf(user), 1);
            }
        }
        const username = this.players.get(client.id);
        if (username)
            this.prismaCommands.updateUserStatus(username, UserStatus.OFFLINE);
        this.players.delete(client.id);
    }
}
