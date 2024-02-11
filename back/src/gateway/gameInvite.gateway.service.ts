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
    namespace: 'gameInvite',
})
@Injectable()
export class GameInviteGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private config: ConfigService,
        private prismaCommands: PrismaCommands,
    ) { }

    @WebSocketServer() server: Server;
    private players = new Map<string, string>();
    private playersId = new Map<string, string>();

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

    @SubscribeMessage('acceptGameInvite')
    async handleGameInviteAccepted(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        const opponentId = this.playersId.get(data.username);
        if (!opponentId) {
            this.emitErrorAndDisconnect(client, 'Opponent not found', 'opponent_not_found');
            this.prismaCommands.updateGameInvites(data.username);
            return;
        }
        const message = await this.prismaCommands.getGameInviteInfo(data.username, data?.groupName);
        if (!message) {
            this.emitErrorAndDisconnect(client, 'No game invite found', 'no_game_invite');
            return;
        }
        this.server.to(client.id).emit('joinGame', { message: 'Found opponent!', roomid: opponentId + client.id, mode: message.gameType});
        this.server.to(opponentId).emit('joinGame', { message: 'Found opponent!', roomid: opponentId + client.id, mode: message.gameType});
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
                this.prismaCommands.updateUserStatus(decoded['sub'], UserStatus.ONLINE);
                this.players.set(client.id, decoded['sub']);
                this.playersId.set(decoded['sub'], client.id);
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
        const username = this.players.get(client.id);
        if (username) {
          this.prismaCommands.updateUserStatus(username, UserStatus.OFFLINE);
          this.players.delete(username);
        }
        this.players.delete(client.id);
      }
}
