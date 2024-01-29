import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket, WsException } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Namespace, Socket } from 'socket.io';
import { BadRequestException, Logger } from '@nestjs/common';
import { messageToClient, messageToServer } from './dto/chat.interface';
import { GroupActionsDto } from './dto/chat.dto';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    @WebSocketServer() server: Namespace;

    constructor(private readonly chatService: ChatService) { }

    private logger: Logger = new Logger(ChatGateway.name);

    //TODO:later ????????? -- usar jwt para verificao de auth para permitir a coneccao
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


    //TODO:later -- 2. ver como fica a logica para direct
    //TODO:later -- 2 .criar o metodo de direct message
    @SubscribeMessage('messageToServer')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: messageToServer) {
        const messageToClient: messageToClient = await this.chatService.saveMessage(message);
        if (messageToClient) {
            this.server.to(message.groupName).emit('messageToClient', messageToClient);
            this.logger.debug(`Client ${client.id} | ${message.username} send message in group ${message.groupName}: |${messageToClient}|`);
        }
    }

    /**
    * @brief when create a group join the owner socket in the group
    */
    @SubscribeMessage('ownerJoinGroup')
    async handleOwnerJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        const permission = await this.chatService.joinOwnerInGroup(groupActionsDto)
        if (permission) {
            client.join(groupActionsDto.groupName);
            this.logger.debug(`Client ${client.id} join group: |${groupActionsDto.groupName}|`);
        }
        else
            throw new BadRequestException('You are not the owner from this group')
    }

    @SubscribeMessage('joinChat')
    async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        const messageToClient: messageToClient = await this.chatService.joinGroup(groupActionsDto);
        client.join(groupActionsDto.groupName);
        this.server.to(groupActionsDto.groupName).emit('messageToClient', messageToClient)
        this.logger.debug(`${groupActionsDto.username} Client ${client.id} join group: |${groupActionsDto.groupName}|`);
    }

    //TEST verificar se o user esta no grupo antes
    @SubscribeMessage('leaveGroup')
    async handleLeaveGroup(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        try {
            const { username, groupName } = groupActionsDto;
            client.leave(groupName);
            this.server.to(groupName).emit('messageToClient', {
                username: username,
                message : `${username} left the group.`,
                date: new Date(),
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

}
