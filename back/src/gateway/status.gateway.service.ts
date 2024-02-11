import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PrismaCommands } from 'src/prisma/prisma.commands';
import { UserStatus } from '@prisma/client';

@WebSocketGateway({
    cors: {
        origin: process.env.REACT_APP_WEB_URL,
        credentials: true,
    },
    namespace: 'status',
})
@Injectable()
export class StatusGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private config: ConfigService,
        private prismaCommands: PrismaCommands,
    ) { }

    @WebSocketServer() server: Server;
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
        if (username)
            this.prismaCommands.updateUserStatus(username, UserStatus.OFFLINE);
        this.players.delete(client.id);
    }
}
