import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Namespace, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { messageToClient, messageToServer } from './chat.interface';


//TODO como testar isso -- ver video nos curtidos de como o cara testou usando o postman
@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    @WebSocketServer() server: Namespace;

    constructor(private readonly chatService: ChatService) { }

    private logger: Logger = new Logger(ChatGateway.name);

    afterInit() {
        this.logger.log('Chat websocket initialized');
    }

    handleConnection(client: Socket) {
        const sockets = this.server.sockets;
        this.logger.log(`Client with id ${client.id} has connected on chat-socket`);
        this.logger.debug(`Number of connected in chat-sockets ${sockets.size}`);
    }

    handleDisconnect(client: Socket) {
        const sockets = this.server.sockets;
        this.logger.log(`Client with id ${client.id} has disconnected from chat-socket`);
        this.logger.debug(`Number of connected in chat-sockets ${sockets.size}`);
    }


    //TEST
    @SubscribeMessage('message')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: messageToServer) {
        const messageToClient: messageToClient = await this.chatService.saveMessage(message);
        if (messageToClient){
            this.server.emit('messageToClient', messageToClient);
            this.server.emit('messageToClient', message);
            this.logger.debug(`Client ${client.id} send message: |${messageToClient}|`);
        }
    }

}
