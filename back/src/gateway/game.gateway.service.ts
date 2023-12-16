import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

interface UserData {
    username: string;
    socketId: string;
}

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
    private queue: UserData[] = [];

    @SubscribeMessage('joinQueue')
    handleJoinQueue(@ConnectedSocket() client: Socket, payload: any): string {
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
            if (this.queue[0] != null) {
                let opponent = this.queue.shift();
                console.log(opponent.socketId)
                console.log(client.id)
                console.log(this.queue);
                this.server.to(client.id).emit('joinGame', { message: 'Found opponent!', opponentId: opponent.socketId });
                this.server.to(opponent.socketId).emit('joinGame', { message: 'Found opponent!', opponentId: client.id });
                return ;
            }
            let player = {username: decoded['sub'], socketId: client.id};
            let userData = player as UserData;
            this.queue.push(userData);
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

    @SubscribeMessage('moveUp')
    handleMoveUp(@ConnectedSocket() client: Socket, payload: any): string {
        console.log('moveUp');
        console.log(client.id);
        return ;
    }

    @SubscribeMessage('moveDown')
    handleMoveDown(@ConnectedSocket() client: Socket, payload: any): string {
        console.log('moveDown');
        console.log(client.id);
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
        const user = this.queue.find(user => user.socketId === client.id);
        if (user){
            console.log(this.queue);
            this.queue.splice(this.queue.indexOf(user), 1);
            console.log(this.queue);
        }
     }
}
