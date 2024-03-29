import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { messageToClient, messageToServer, gameInviteToServer, gameInviteClient } from "./dto/chat.interface";
import { BanUser, BlockUser, CreateDmGroup, CreateGroupDto, GroupActionsDto, InviteToGroupDto, KickUser, MuteUser, PassowordChannel, SetAdm, SetOnlyInvite, DeleteDmGroup } from "./dto/chat.dto";
import { GroupService } from "./services/group.service";
import * as argon from 'argon2';
import { ChatGateway } from "./chat.gateway";
import { GroupStatus } from "@prisma/client";

@Injectable()
export class ChatService {
    private _chatGateway: ChatGateway;

    set chatGateway(chatGateway: ChatGateway) {
        this._chatGateway = chatGateway;
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly groupService: GroupService,
    ) { }

    async saveMessage(messageToServer: messageToServer) {
        const user = await this.groupService.getUserByUsername(messageToServer.username,);
        const chat = await this.groupService.getGroupByName(messageToServer.groupName,);
        if (!messageToServer.message)
            throw new BadRequestException("Invalid request - message");

        const messageDB = await this.prisma.message.create({
            data: {
                sender: { connect: { id: user.id } },
                group: { connect: { id: chat.id } },
                date: new Date(),
                content: messageToServer.message,
                gameInvite: false,
            },
        });
        const messageToClient: messageToClient = {
            id: messageDB.id,
            groupName: chat.name,
            username: user.user,
            message: messageDB.content,
            date: messageDB.date,
        };
        return messageToClient;
    }

    async createGroup({ type, groupName, ownerUsername, password }: CreateGroupDto) {
        const userOwner = await this.groupService.getUserByUsername(ownerUsername);
        this.groupService.validatePasswordForGroupType(type, password);
        if (type === "PROTECT" && password)
            password = await argon.hash(password);
        await this.prisma.group.create({
            data: {
                name: groupName,
                type: type,
                password: password,
                owner: { connect: { id: userOwner.id } },
                members: { create: { user: { connect: { id: userOwner.id } } } },
                admins: { create: { user: { connect: { id: userOwner.id } } } },
            },
        });
        return { name: groupName, type: type };
    }

    async joinGroup(groupActionsDto: GroupActionsDto) {
        const user = await this.groupService.getUserByUsername(groupActionsDto.username,);
        const group = await this.groupService.getGroupByName(groupActionsDto.groupName,);

        const isBanned = await this.groupService.isUserBanned(user.id, group.id);
        if (isBanned)
            throw new BadRequestException(`${groupActionsDto.username} is banned from joining ${groupActionsDto.groupName}`);

        const permission = await this.groupService.checkUserPermissionGroupType(user, group, groupActionsDto.password)
        if (!permission)
            throw new BadRequestException('Invalid form or permission for group type')

        await this.groupService.addMembership(user, group);
        const messageToClient: messageToClient = {
            groupName: user.user,
            username: group.name,
            message: "joined in the group",
            date: new Date(Date.now()),
        };
        const refresh = {
            groupName: group.name,
            userUsername: user.user,
            type: group.type
        }
        return {messageToClient, refresh};
    }

    /**
    * @brief when create a group in controller the front end should use this socket to join the owner socket in group
    */
    async joinOwnerInGroup(groupActionsDto: GroupActionsDto): Promise<boolean> {
        const group = await this.groupService.getGroupByName(groupActionsDto.groupName,);
        const target = await this.groupService.getUserByUsername(groupActionsDto.username,);
        if (group.ownerId === target.id)
            return true;
        return false;

    }

    //async inviteToGroup(inviteToGroupDto: InviteToGroupDto) {
    //    const group = await this.groupService.getGroupByName(inviteToGroupDto.groupName);
    //    if (group.type !== 'PRIVATE')
    //        throw new BadRequestException(`Group ${group.name} is not a Private type`)
    //    const admUser = await this.groupService.getUserByUsername(inviteToGroupDto.admUsername);
    //    const isAdm = await this.groupService.isAdmInGroup(admUser.id, group.id);
    //    if (!isAdm)
    //        throw new BadRequestException(`User ${admUser.user} is not a ADM in Group ${group.name}`);
    //
    //    const invitedUser = await this.groupService.getUserByUsername(inviteToGroupDto.invitedUsername);
    //    const isMember = await this.groupService.isMemberInGroup(invitedUser.id, group.id);
    //    if (isMember)
    //        throw new BadRequestException(`User ${invitedUser.user} alredy is a member in Group ${group.name}`);
    //
    //    const wasInvited = await this.groupService.checkExistingInviteForUserInGroup(invitedUser.id, group.id);
    //    if (wasInvited)
    //        throw new BadRequestException('User is alredy invited')
    //    await this.prisma.groupInvite.create({
    //        data: {
    //            groupId: group.id,
    //            invitedUserId: invitedUser.id,
    //            invitedByUserId: admUser.id,
    //        },
    //    })
    //}

    async inviteToGroupPrivate(inviteToGroupDto: InviteToGroupDto) {
        const group = await this.groupService.getGroupByName(inviteToGroupDto.groupName);
        if (group.type !== 'PRIVATE')
            throw new BadRequestException(`Group ${group.name} is not a Private type`)
        const admUser = await this.groupService.getUserByUsername(inviteToGroupDto.admUsername);

        const invitedUser = await this.groupService.getUserByUsername(inviteToGroupDto.invitedUsername);
        const isMember = await this.groupService.isMemberInGroup(invitedUser.id, group.id);
        if (isMember)
            throw new BadRequestException(`User ${invitedUser.user} alredy is a member in Group ${group.name}`);

        const wasInvited = await this.groupService.checkExistingInviteForUserInGroup(invitedUser.id, group.id);
        if (wasInvited)
            throw new BadRequestException('User is alredy invited')
        await this.prisma.groupInvite.create({
            data: {
                groupId: group.id,
                invitedUserId: invitedUser.id,
                invitedByUserId: admUser.id,
            },
        })
    }

    async setUserAsAdm(setAdm: SetAdm) {
        const group = await this.groupService.getGroupByName(setAdm.groupName);
        const adm = await this.groupService.getUserByUsername(setAdm.admUsername);
        const user = await this.groupService.getUserByUsername(setAdm.targetUsername);

        await this.groupService.validateAdmActions(adm, user, group);
        await this.prisma.groupAdmin.create({
            data: {
                userId: user.id,
                groupId: group.id,
            }
        });
    }

    async removeAdm(setAdm: SetAdm) {
        const group = await this.groupService.getGroupByName(setAdm.groupName);
        const adm = await this.groupService.getUserByUsername(setAdm.admUsername);
        const user = await this.groupService.getUserByUsername(setAdm.targetUsername);

        await this.groupService.validateAdmActions(adm, user, group);
        await this.prisma.groupAdmin.deleteMany({
            where: {
                userId: user.id,
                groupId: group.id,
            }
        });
    }

    async changeChannelPass(passwordChannel: PassowordChannel) {
        const owner = await this.groupService.getUserByUsername(passwordChannel.ownerUsername);
        const group = await this.groupService.getGroupByName(passwordChannel.groupName);

        if (group.ownerId !== owner.id)
            throw new BadRequestException(`user ${owner.user} is not the owner in channel ${group.name}`);

        if (passwordChannel.password) {
            const password = await argon.hash(passwordChannel.password);
            await this.prisma.group.update({
                where: { id: group.id },
                data: { password: password, type: "PROTECT" }
            });
        } else {
            await this.prisma.group.update({
                where: { id: group.id },
                data: { password: null, type: "PUBLIC" },
            });
        }
    }

    async setChannelOnlyInvite(setOnlyInvite: SetOnlyInvite) {
        const owner = await this.groupService.getUserByUsername(setOnlyInvite.ownerUsername);
        const group = await this.groupService.getGroupByName(setOnlyInvite.groupName);
        if (group.ownerId !== owner.id)
            throw new BadRequestException(`user ${owner.user} is not the owner in channel ${group.name}`);
        await this.prisma.group.update({
            where: { id: group.id },
            data: { password: null, type: "PRIVATE" }
        });
    }

    async leaveChannel(username: string, groupName: string) {
        const user = await this.groupService.getUserByUsername(username);
        const group = await this.groupService.getGroupByName(groupName);

        const isMember = await this.groupService.isMemberInGroup(user.id, group.id);
        if (!isMember)
            throw new BadRequestException(`${user.user} is not a member in ${group.name}`)
        if (group.ownerId == user.id) {
            var emptyGroup = await this.groupService.passOwner(user, group);
        }

        await this.groupService.deleteUserFromGroup(user.id, group.id);
        if (emptyGroup) {
            await this.prisma.group.delete({ where: { id: group.id } });
        }
    }

    async kickUser(kickUser: KickUser) {
        const group = await this.groupService.getGroupByName(kickUser.groupName);
        const adm = await this.groupService.getUserByUsername(kickUser.admUsername);
        const target = await this.groupService.getUserByUsername(kickUser.targetUsername);

        await this.groupService.validateAdmActions(adm, target, group);
        await this.groupService.deleteUserFromGroup(target.id, group.id);

        const username = target.user;
        if (this._chatGateway) {
            const socketId = this._chatGateway.getUserSocketId(username);
            if (socketId) {
                this._chatGateway.leaveUserFromGroup(socketId, group.name)
            }
        }
    }

    async banUser(banUser: BanUser) {
        const { admUsername, targetUsername, groupName, banDuration } = banUser;
        const adm = await this.groupService.getUserByUsername(admUsername);
        const target = await this.groupService.getUserByUsername(targetUsername);
        const group = await this.groupService.getGroupByName(groupName);

        await this.groupService.validateAdmActions(adm, target, group);
        await this.groupService.deleteUserFromGroup(target.id, group.id);

        await this.prisma.ban.create({
            data: {
                userId: target.id,
                groupId: group.id,
                expirationDate: banDuration ? new Date(new Date().getTime() + banDuration * 60000) : null,
            },
        });

        const username = target.user;
        if (this._chatGateway) {
            const socketId = this._chatGateway.getUserSocketId(username);
            if (socketId) {
                this._chatGateway.leaveUserFromGroup(socketId, group.name)
            }
        }

    }

    async removeBanCommand(banUser: BanUser) {
        const { admUsername, targetUsername, groupName } = banUser;
        const adm = await this.groupService.getUserByUsername(admUsername);
        const target = await this.groupService.getUserByUsername(targetUsername);
        const group = await this.groupService.getGroupByName(groupName);

        const isAdm = await this.groupService.isAdmInGroup(adm.id, group.id);

        if (!isAdm)
            throw new BadRequestException(`${adm.user} is not a adm in ${group.name}`)
        if (group.ownerId == target.id)
            throw new BadRequestException(`${target.user} is the owner from ${group.name}`)
        if (adm.id == target.id)
            throw new BadRequestException(`you cannot do it in your self'`)
        const isBanned = await this.groupService.isUserBanned(target.id, group.id);
        if (isBanned) {
            await this.prisma.ban.deleteMany({
                where: {
                    userId: target.id,
                    groupId: group.id,
                },
            });
        } else {
            throw new BadRequestException(`${targetUsername} is not banned from ${groupName}`)
        }
    }

    async muteUser(muteUser: MuteUser) {
        const { admUsername, targetUsername, groupName, muteDuration } = muteUser;
        const adm = await this.groupService.getUserByUsername(admUsername);
        const target = await this.groupService.getUserByUsername(targetUsername);
        const group = await this.groupService.getGroupByName(groupName);
        await this.groupService.validateAdmActions(adm, target, group);

        await this.prisma.mute.create({
            data: {
                userId: target.id,
                groupId: group.id,
                expirationDate: muteDuration ? new Date(new Date().getTime() + muteDuration * 60000) : null,
            },
        });
    }

    async removeMute(muteUser: MuteUser) {
        const { admUsername, targetUsername, groupName } = muteUser;
        const adm = await this.groupService.getUserByUsername(admUsername);
        const target = await this.groupService.getUserByUsername(targetUsername);
        const group = await this.groupService.getGroupByName(groupName);
        await this.groupService.validateAdmActions(adm, target, group);

        await this.prisma.mute.deleteMany({
            where: {
                userId: target.id,
                groupId: group.id,
            },
        });
    }

    async blockUser(blockUser: BlockUser) {
        const { userUsername, targetUsername } = blockUser;
        const user = await this.groupService.getUserByUsername(userUsername);
        const target = await this.groupService.getUserByUsername(targetUsername);

        await this.prisma.block.create({
            data: {
                userId: user.id,
                blockedUserId: target.id,
            }
        })
    }

    async removeBlock(blockUser: BlockUser) {
        const { userUsername, targetUsername } = blockUser;
        const user = await this.groupService.getUserByUsername(userUsername);
        const target = await this.groupService.getUserByUsername(targetUsername);

        await this.prisma.block.deleteMany({
            where: {
                userId: user.id,
                blockedUserId: target.id,
            }
        })
    }

    async createDmGroup(groupDm: CreateDmGroup) {
        const userA = await this.groupService.getUserByUserId(groupDm.userA);
        const userB = await this.groupService.getUserByUserId(groupDm.userB);
        const groupName = `Dm-${userA.user}-${userB.user}`
        await this.prisma.groupDM.create({
            data: {
                name: groupName,
                type: GroupStatus.DIRECT,
                members: {
                    createMany: {
                        data: [
                            { userId: groupDm.userA },
                            { userId: groupDm.userB },
                        ],
                    },
                },
            },
        });
        this.emitDmGroupCreated(groupName, userA.user, userB.user);
    }

    async emitDmGroupCreated(groupName: string, userA: string, userB: string){
        const sockedIdA = this._chatGateway.getUserSocketId(userA)
        const sockedIdB = this._chatGateway.getUserSocketId(userB)
        await this._chatGateway.joinDmGroup(sockedIdA, groupName)
        await this._chatGateway.joinDmGroup(sockedIdB, groupName)
        await this._chatGateway.socketEmitDmGroup(sockedIdA, groupName, userA, userB );
    }

    async deleteDmGroup(deleteDmGroup: DeleteDmGroup) {
        const dmGroup = await this.groupService.getDmGroupByName(deleteDmGroup.groupName);
        if (!dmGroup)
            throw new BadRequestException('group not found');
        await this.prisma.groupDM.delete({
            where: { id: dmGroup.id },
        });
    }

    async DmSaveMessage(messageToServer: messageToServer) {
        const user = await this.groupService.getUserByUsername(messageToServer.username,);
        const chat = await this.groupService.getDmGroupByName(messageToServer.groupName,);
        if (!messageToServer.message)
            throw new BadRequestException("Invalid request - message");

        const messageDB = await this.prisma.message.create({
            data: {
                sender: { connect: { id: user.id } },
                groupDM: { connect: { id: chat.id } },
                date: new Date(),
                content: messageToServer.message,
                gameInvite: false,
            },
        });
        const messageToClient: messageToClient = {
            id: messageDB.id,
            groupName: chat.name,
            username: user.user,
            message: messageDB.content,
            date: messageDB.date,
        };
        return messageToClient;
    }

    async saveGameInvite(gameInviteToServer: gameInviteToServer) {
        const user = await this.groupService.getUserByUsername(gameInviteToServer.username,);

        const group = await this.prisma.group.findUnique({
            where: { name: gameInviteToServer.groupName },
        })
        if (group){
            await this.prisma.message.updateMany({
                where: {
                    senderId: user.id,
                    groupId: group.id,
                    gameInvite: true
                },
                data: {
                    gameInvite: false
                }
            })

            const messageDB = await this.prisma.message.create({
                data: {
                    sender: { connect: { id: user.id } },
                    group: { connect: { id: group.id } },
                    date: new Date(),
                    content: "Expired Game Invite",
                    gameInvite: true,
                    gameType: gameInviteToServer.gameType,
                },
            });

            const gameInviteClient: gameInviteClient = {
                id: messageDB.id,
                groupName: group.name,
                username: user.user,
                date: messageDB.date,
                gameInvite: messageDB.gameInvite
            };
            return gameInviteClient;
        }

        const groupDM = await this.prisma.groupDM.findUnique({
            where: { name: gameInviteToServer.groupName },
        })

        await this.prisma.message.updateMany({
            where: {
                senderId: user.id,
                groupDMId: groupDM.id,
                gameInvite: true
            },
            data: {
                gameInvite: false
            }
        })

        const messageDB = await this.prisma.message.create({
            data: {
                sender: { connect: { id: user.id } },
                groupDM: { connect: { id: groupDM.id } },
                date: new Date(),
                content: "Expired Game Invite",
                gameInvite: true,
                gameType: gameInviteToServer.gameType,
            },
        });

        const gameInviteClient: gameInviteClient = {
            id: messageDB.id,
            groupName: groupDM.name,
            username: user.user,
            date: messageDB.date,
            gameInvite: messageDB.gameInvite
        };
        return gameInviteClient;
    }

}
