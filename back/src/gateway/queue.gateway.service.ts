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
    namespace: 'queue',
})
@Injectable()
export class QueueGatewayService implements OnGatewayConnection, OnGatewayDisconnect{
	constructor(
        private config: ConfigService,
    ) {}

    @WebSocketServer() server: Server;
    private queue: UserData[] = [];

    @SubscribeMessage('joinQueue')
    handleJoinQueue(@ConnectedSocket() client: Socket): string {
        if (!client.handshake.headers.cookie) {
			console.log('Missing Token');
			client.emit('missing_token', { message: 'Missing Token' });
            client.disconnect();
            return;
        }
        const token = client.handshake.headers.cookie.split('accessToken=')[1];
		if (!token) {
			console.log('Missing Token');
			client.emit('missing_token', { message: 'Missing Token' });
            client.disconnect();
            return;
        }
        const end = token.indexOf(';');
		let result : string;
		if (end == -1) {
			result = token.substring(0);
		}
		else{
			result = token.substring(0, end);
		}
        try {
            const decoded = jwt.verify(
                result,
                this.config.get('JWT_SECRET_ACCESS'),
            );
            if (this.queue[0] != null) {
                const opponent = this.queue.shift();
                this.server.to(client.id).emit('joinGame', { message: 'Found opponent!', roomId: opponent.socketId + client.id });
                this.server.to(opponent.socketId).emit('joinGame', { message: 'Found opponent!', roomId: opponent.socketId + client.id });
                return ;
            }
            const player = {username: decoded['sub'], socketId: client.id};
            const userData = player as UserData;
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

    handleConnection(@ConnectedSocket() client: Socket){
        if (!client.handshake.headers.cookie) {
			console.log('Missing Token');
			client.emit('missing_token', { message: 'Missing Token' });
            client.disconnect();
            return;
        }
        const token = client.handshake.headers.cookie.split('accessToken=')[1];
		if (!token) {
			console.log('Missing Token');
			client.emit('missing_token', { message: 'Missing Token' });
            client.disconnect();
            return;
        }
        const end = token.indexOf(';');
		let result : string;
		if (end == -1) {
			result = token.substring(0);
		}
		else{
			result = token.substring(0, end);
		}
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
