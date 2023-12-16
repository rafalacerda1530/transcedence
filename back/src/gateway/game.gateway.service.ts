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
        console.log(client.id);
        console.log(data.roomId);
        client.to(data.roomId).emit('moveDown', { message: 'moveUp' });
        return ;
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
        console.log(data);
        console.log(data.roomId);
        client.join(data.roomId);
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
     }

     handleDisconnect(@ConnectedSocket() client: Socket){
     }
}
