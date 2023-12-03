import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Namespace, Socket } from 'socket.io';
import { BadRequestException, Logger } from '@nestjs/common';
import { messageToClient, messageToServer } from './dto/chat.interface';
import { GroupActionsDto } from './dto/chat.dto';
import { group } from 'console';

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


    //TODO: ver como fica a logica para direct
    //TODO: criar o metodo de direct message
    @SubscribeMessage('messageToServer')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: messageToServer) {
        const messageToClient: messageToClient = await this.chatService.saveMessage(message);
        if (messageToClient) {
            this.server.to(message.groupName).emit('messageToClient', messageToClient);
            this.logger.debug(`Client ${client.id} send message in group ${message.groupName}: |${messageToClient}|`);
        }
    }

    /**
    * @brief when create a group join the owner socket in the group
    */
    @SubscribeMessage('ownerJoinGroup')
    async handleOwnerJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        const permission = this.chatService.joinOwnerInGroup(groupActionsDto)
        if (permission)
            client.join(groupActionsDto.groupName);
        else
            throw new BadRequestException('You are not the owner from this group')
    }


    @SubscribeMessage('joinChat')
    async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        const messageToClient: messageToClient = await this.chatService.joinGroup(groupActionsDto);
        client.join(groupActionsDto.groupName);
        this.server.to(groupActionsDto.groupName).emit('messageToClient', messageToClient)

        console.log(messageToClient)
        this.logger.debug(`Client ${client.id} join group: |${groupActionsDto.groupName}|`);
    }
}
