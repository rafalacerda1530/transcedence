import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Namespace, Socket } from 'socket.io';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { messageToClient, messageToServer, gameInviteToServer, gameInviteClient } from './dto/chat.interface';
import { BanUser, BlockUser, CreateGroupDto, GetMembers, GroupActionsDto, KickUser, MuteUser, PassowordChannel, SetAdm, SetOnlyInvite } from './dto/chat.dto';
import { GroupService } from './services/group.service';
import * as jwt from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config';
import { GroupStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleInit {

    @WebSocketServer() server: Namespace;
    constructor(
        private readonly chatService: ChatService,
        private readonly groupService: GroupService,
        private readonly prisma: PrismaService,
        private config: ConfigService,
    ) { }

    private logger: Logger = new Logger(ChatGateway.name);
    private userSocketMap: Map<string, string> = new Map();

    onModuleInit() {
        this.chatService.chatGateway = this;
    }

    afterInit() {
        this.logger.log('Chat websocket initialized');
    }

    async handleConnection(client: Socket) {
        const sockets = this.server.sockets;
        const token = this.getTokenFromCookie(client);
        if (!token) {
            this.emitErrorAndDisconnect(client, 'Missing Token', 'missing_token');
            return;
        }
        try {
            const decoded = jwt.verify(token, this.config.get('JWT_SECRET_ACCESS'),);
            if (typeof decoded['sub'] === 'string') {
                const username = decoded['sub'];
                this.userSocketMap.set(username, client.id);

                const userGroupAndDm = await this.groupService.getUserGroupAndDm(username);
                if (userGroupAndDm) {
                    for (const { name } of userGroupAndDm) {
                        client.join(name);
                    }
                    client.emit('GroupsAndDms', userGroupAndDm)
                }
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
        client.emit(event, { message });
        client.disconnect();
    }

    handleDisconnect(client: Socket) {
        const sockets = this.server.sockets;
        const socketId = client.id;
        this.userSocketMap.forEach((storedSocketId, userId) => {
            if (storedSocketId === socketId) {
                this.userSocketMap.delete(userId);
                return;
            }
        });
        this.logger.log(`Client with id ${client.id} has disconnected from chat-socket`);
        this.logger.debug(`Number of connected in chat-sockets ${sockets.size}`);
    }



    /**
    * @brief when create a group join the owner socket in the group
    */

    async handleOwnerJoinGroup(client: Socket, groupActionsDto: GroupActionsDto, type: string) {
        const permission = await this.chatService.joinOwnerInGroup(groupActionsDto)
        if (permission) {
            client.emit('joinOwnerOnGroup', { name: groupActionsDto.groupName, type: type })
            client.join(groupActionsDto.groupName);
            this.logger.debug(`Client ${client.id} join group: |${groupActionsDto.groupName}|`);
        }
        else
            throw new BadRequestException('You are not the owner from this group')
    }

    @SubscribeMessage('joinChat')
    async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() groupActionsDto: GroupActionsDto) {
        try {
            const { messageToClient: messageToClient, refresh } = await this.chatService.joinGroup(groupActionsDto);
            client.join(groupActionsDto.groupName);
            this.server.to(groupActionsDto.groupName).emit('messageToClient', messageToClient)
            this.server.to(groupActionsDto.groupName).emit('joinedGroup', refresh)
            this.logger.debug(`${groupActionsDto.username} Client ${client.id} join group: |${groupActionsDto.groupName}|`);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('messageToServer')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: messageToServer) {
        const isMutted = await this.groupService.isUserMutted(message.username, message.groupName);
        if (isMutted) {
            throw new BadRequestException('you are mutted in this channel');
        }
        const user = await this.groupService.getUserByUsername(message.username);
        const group = await this.groupService.getGroupByName(message.groupName);
        const isUserMember = await this.groupService.isMemberInGroup(user.id, group.id)

        if (isUserMember) {
            const messageToClient: messageToClient = await this.chatService.saveMessage(message);
            if (messageToClient) {
                this.server.to(message.groupName).emit('messageToClient', messageToClient);
                this.logger.debug(`Client ${client.id} | ${message.username} send message in group ${message.groupName}: |${messageToClient}|`);
            }
        }
    }

    @SubscribeMessage('DmMessageToServer')
    async DmHandleMessage(@ConnectedSocket() client: Socket, @MessageBody() message: messageToServer) {
        const isUserBlocked = await this.groupService.DmIsUserBlocked(message.groupName);
        if (isUserBlocked)
            throw new BadRequestException('you are blocked and cannot send message for this person');

        const messageToClient: messageToClient = await this.chatService.DmSaveMessage(message);
        if (messageToClient) {
            this.server.to(message.groupName).emit('messageToClient', messageToClient);
            this.logger.debug(`Client ${client.id} | ${message.username} send message in group ${message.groupName}: |${messageToClient}|`);
        }
    }

    @SubscribeMessage('gameInvite')
    async handleGameInvite(@ConnectedSocket() client: Socket, @MessageBody() message: gameInviteToServer) {
        const group = await this.prisma.group.findUnique({
            where: { name: message.groupName },
        })
        const user = await this.groupService.getUserByUsername(message.username);

        if (group) {
            const isMutted = await this.groupService.isUserMutted(message.username, message.groupName);
            if (isMutted) {
                throw new BadRequestException('you are mutted in this channel');
            }
            const isUserMember = await this.groupService.isMemberInGroup(user.id, group.id)
            if (isUserMember) {
                const gameInviteClient: gameInviteClient = await this.chatService.saveGameInvite(message);
                if (gameInviteClient) {
                    this.server.to(message.groupName).emit('messageToClient', gameInviteClient);
                    this.logger.debug(`Client ${client.id} | ${message.username} send message in group ${message.groupName}: |${gameInviteClient}|`);
                }
            }
            return;
        }

        const groupDM = await this.prisma.groupDM.findUnique({
            where: { name: message.groupName },
        })
        if (groupDM) {
            const gameInviteClient: gameInviteClient = await this.chatService.saveGameInvite(message);
            if (gameInviteClient) {
                this.server.to(message.groupName).emit('messageToClient', gameInviteClient);
                this.logger.debug(`Client ${client.id} | ${message.username} send message in group ${message.groupName}: |${gameInviteClient}|`);
            }
        }
        return;
    }

    @SubscribeMessage('createGroup')
    async createGroup(@ConnectedSocket() client: Socket, @MessageBody() createGroupDto: CreateGroupDto) {
        try {
            const isDM = createGroupDto.groupName.startsWith("Dm-");
            if (!isDM) {
                const newGroup = await this.chatService.createGroup(createGroupDto);
                if (newGroup) {
                    const parameter: GroupActionsDto = {
                        groupName: createGroupDto.groupName,
                        username: createGroupDto.ownerUsername
                    }
                    this.handleOwnerJoinGroup(client, parameter, createGroupDto.type);
                    this.server.emit('groupCreated', newGroup)
                }
            }
        } catch (error) {
            throw new BadRequestException(error.message);
        }
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

    getUserSocketId(primaryKey: string): string {
        return this.userSocketMap.get(primaryKey);
    }

    //TODO  TEST
    async socketEmitDmGroup(socketId: string, groupName: string, userA: string, userB: string) {
        try {
            // const socket = this.server.sockets.get(socketId)
            this.server.to(groupName).emit('DmGroupCreated', {
                type: GroupStatus.DIRECT,
                name: groupName,
                userA: userA,
                userB: userB,
            });
        } catch (error) {
            return;
        }
    }
    async joinDmGroup(socketId: string, groupName: string) {
        try {
            const socket = this.server.sockets.get(socketId)

            socket.join(groupName);

        } catch (error) {
            return;
        }
        // this.server.to(groupActionsDto.groupName).emit('messageToClient', messageToClient)
        // this.logger.debug(`${groupActionsDto.username} Client ${client.id} join group: |${groupActionsDto.groupName}|`);
    }


    leaveUserFromGroup(socketId: string, groupName: string) {
        try {
            const socket = this.server.sockets.get(socketId)
            socket.leave(groupName);
            this.server.to(groupName).emit('messageToClient', {
                username: socketId,
                message: `${socketId} left the group.`,
                date: new Date(),
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('getMembersInGroup')
    async getMembersInChat(@ConnectedSocket() client: Socket, @MessageBody() getMembers: GetMembers) {
        try {
            const members = await this.groupService.getMembersInChat(getMembers);
            client.emit('membersInGroup', getMembers.groupName, members)
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('kickUser')
    async kickUser(@ConnectedSocket() client: Socket, @MessageBody() kickUser: KickUser) {
        try {
            await this.chatService.kickUser(kickUser);
            const updatedMembers = await this.groupService.getMembersInChat({
                groupName: kickUser.groupName,
                type: 'PUBLIC'
            });
            this.server.to(kickUser.groupName).emit('membersInGroup', kickUser.groupName, updatedMembers);
            client.to(kickUser.groupName).emit('membersInGroup', kickUser.groupName, updatedMembers);


        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('banUser')
    async banUser(@ConnectedSocket() client: Socket, @MessageBody() banUser: BanUser) {
        try {
            await this.chatService.banUser(banUser);
            const updatedMembers = await this.groupService.getMembersInChat({
                groupName: banUser.groupName,
                type: 'PUBLIC'
            });
            this.server.to(banUser.groupName).emit('membersInGroup', banUser.groupName, updatedMembers);
            client.to(banUser.groupName).emit('membersInGroup', banUser.groupName, updatedMembers);
            this.server.to(banUser.groupName).emit('userBanned', banUser.targetUsername);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('unbanUser')
    async unbanUser(@ConnectedSocket() client: Socket, @MessageBody() banUser: BanUser) {
        try {
            await this.chatService.removeBanCommand(banUser);
            this.server.to(banUser.groupName).emit('userUnbanned', banUser.targetUsername);
            client.to(banUser.groupName).emit('userUnbanned', banUser.targetUsername);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('setAdm')
    async setUserAsAdm(@ConnectedSocket() client: Socket, @MessageBody() setAdm: SetAdm) {
        try {
            await this.chatService.setUserAsAdm(setAdm);
            this.server.to(setAdm.groupName).emit('setAdmResponse', { groupName: setAdm.groupName, targetUsername: setAdm.targetUsername });
            client.to(setAdm.groupName).emit('setAdmResponse', { groupName: setAdm.groupName, targetUsername: setAdm.targetUsername });

        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('unsetAdm')
    async unsetUserAsAdm(@ConnectedSocket() client: Socket, @MessageBody() setAdm: SetAdm) {
        try {
            await this.chatService.removeAdm(setAdm);
            this.server.to(setAdm.groupName).emit('unsetAdmResponse', { groupName: setAdm.groupName, targetUsername: setAdm.targetUsername });
            client.to(setAdm.groupName).emit('unsetAdmResponse', { groupName: setAdm.groupName, targetUsername: setAdm.targetUsername });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('muteUser')
    async muteUser(@ConnectedSocket() client: Socket, @MessageBody() muteUser: MuteUser) {
        try {
            await this.chatService.muteUser(muteUser);
            this.server.to(muteUser.groupName).emit('muteUserResponse', { groupName: muteUser.groupName, targetUsername: muteUser.targetUsername });
            client.to(muteUser.groupName).emit('muteUserResponse', { groupName: muteUser.groupName, targetUsername: muteUser.targetUsername });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('removeMute')
    async removeMute(@ConnectedSocket() client: Socket, @MessageBody() muteUser: MuteUser) {
        try {
            await this.chatService.removeMute(muteUser);
            this.server.to(muteUser.groupName).emit('removeMuteUserResponse', { groupName: muteUser.groupName, targetUsername: muteUser.targetUsername });
            client.to(muteUser.groupName).emit('removeMuteUserResponse', { groupName: muteUser.groupName, targetUsername: muteUser.targetUsername });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('changeChannelPass')
    async changeChannelPass(@ConnectedSocket() client: Socket, @MessageBody() passowordChannel: PassowordChannel) {
        try {
            await this.chatService.changeChannelPass(passowordChannel);
            const group = await this.groupService.getGroupByName(passowordChannel.groupName);
            this.server.emit('groupTypeUpdated', { groupName: group.name, type: group.type });
            // client.emit('groupTypeUpdated', { groupName: group.name, type: group.type });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('setChannelOnlyInvite')
    async setChannelOnlyInvite(@ConnectedSocket() client: Socket, @MessageBody() setOnlyInvite: SetOnlyInvite) {
        try {
            await this.chatService.setChannelOnlyInvite(setOnlyInvite);
            const group = await this.groupService.getGroupByName(setOnlyInvite.groupName);
            this.server.emit('groupTypeUpdated', { groupName: group.name, type: group.type });
            // client.emit('groupTypeUpdated', { groupName: group.name, type: group.type });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('blockUser')
    async blockUser(@ConnectedSocket() client: Socket, @MessageBody() blockUser: BlockUser) {
        try {
            await this.chatService.blockUser(blockUser);
            client.emit('blockUserResponse', { target: blockUser.targetUsername });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @SubscribeMessage('unblockUser')
    async removeBlock(@ConnectedSocket() client: Socket, @MessageBody() blockUser: BlockUser) {
        try {
            await this.chatService.removeBlock(blockUser);
            client.emit('unblockUserResponse', { target: blockUser.targetUsername });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

}
