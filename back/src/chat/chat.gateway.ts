import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Namespace, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { messageToClient, messageToServer } from './chat.interface';
import { ChatActionsDto } from './dto/chat.dto';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    @WebSocketServer() server: Namespace;

    constructor(private readonly chatService: ChatService) { }

    private logger: Logger = new Logger(ChatGateway.name);

    //TODO: usar jwt para verificao de auth para permitir a coneccao
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


    //TODO: ARRUMAR PARA ACEITAR AS SALAS AGR
    //TODO: criar o metodo de direct message
    @SubscribeMessage('messageToServer')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: messageToServer) {
        const messageToClient: messageToClient = await this.chatService.saveMessage(message);
        if (messageToClient) {
            this.server.emit('messageToClient', messageToClient);
            this.logger.debug(`Client ${client.id} send message: |${messageToClient}|`);
        }
    }

    @SubscribeMessage('joinChat')
    async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatActionsDto: ChatActionsDto) {
        const messageToClient: messageToClient = await this.chatService.joinGroup(chatActionsDto);
        client.join(chatActionsDto.chatName);
        this.server.to(chatActionsDto.chatName).emit('messageToClient', messageToClient)

        // console.log(messageToClient)
        this.logger.debug(`Client ${client.id} join group: |${chatActionsDto}|`);
    }
}
