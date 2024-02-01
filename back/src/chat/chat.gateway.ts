import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Namespace, Socket } from 'socket.io';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { messageToClient, messageToServer } from './dto/chat.interface';
import { GroupActionsDto } from './dto/chat.dto';
import { GroupService } from './services/group.service';
import * as jwt from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config';

@Injectable()
@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

    @WebSocketServer() server: Namespace;
    constructor(
        private readonly chatService: ChatService,
        private readonly groupService: GroupService,
        private config: ConfigService,
    ) { }

    private logger: Logger = new Logger(ChatGateway.name);
    private userSocketMap: Map<string, string> = new Map();

    afterInit() {
        this.logger.log('Chat websocket initialized');
    }

    handleConnection(client: Socket) {
        const sockets = this.server.sockets;
        const token = this.getTokenFromCookie(client);
        if (!token) {
            this.emitErrorAndDisconnect(client, 'Missing Token', 'missing_token');
            return;
        }
        try {
            const decoded = jwt.verify(token, this.config.get('JWT_SECRET_ACCESS'),);
            if (typeof decoded['sub'] === 'string') {
                const userId = decoded['sub'];
                this.userSocketMap.set(userId, client.id);
                console.log(this.userSocketMap)
            }
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                this.emitErrorAndDisconnect(client, 'JWT expired', 'jwt_error');
            }
            client.disconnect();
            return;
        }
        this.logger.log(`Client with id ${client.id} has connected on chat-socket`);
        this.logger.debug(`Number of connected in chat-sockets ${sockets.size}`);
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

    emitErrorAndDisconnect(client: Socket, message: string, event: string) {
        console.log(message);
        client.emit(event, { message });
        client.disconnect();
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
        const isMutted = await this.groupService.isUserMutted(message.username, message.groupName);
        if (isMutted)
            throw new BadRequestException('you are mutted in this channel');

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

    @SubscribeMessage('leaveGroup')
    async handleLeaveGroup(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        try {
            const { username, groupName } = groupActionsDto;
            await this.chatService.leaveChannel(username, groupName);
            client.leave(groupName);
            this.server.to(groupName).emit('messageToClient', {
                username: username,
                message: `${username} left the group.`,
                date: new Date(),
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('leftGroup')
    async handleleftGroup(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        try {
            const { username, groupName } = groupActionsDto;
            client.leave(groupName);
            this.server.to(groupName).emit('messageToClient', {
                username: username,
                message: `${username} left the group.`,
                date: new Date(),
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    getUserSocketId(primaryKey: string): string {
        console.log('-------')
       const teste =  this.userSocketMap.get(primaryKey);
        console.log(teste)
        return teste
    }

    leaveUserFromGroup(socketId: string, groupName: string) {
        const socket = this.server.sockets.get(socketId)
        if (socket)
            socket.leave(groupName);
    }

}
