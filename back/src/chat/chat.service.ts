import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { messageToClient, messageToServer } from "./dto/chat.interface";
import { CreateGroupDto, GroupActionsDto, InviteToGroupDto, KickUser, PassowordChannel, SetAdm, SetOnlyInvite } from "./dto/chat.dto";
import { GroupService } from "./services/group.service";
import * as argon from 'argon2';
import { Group, User } from "@prisma/client";

//TODO later -- NEED IMPLEMENT A FRONT END ROOMS AND MESSAGES TO ROOMS JUST SIMPLE
@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly groupService: GroupService,
    ) { }

    // TODO:later -- ver se é nescessario o uso de id
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
        const newGroup = await this.prisma.group.create({
            data: {
                name: groupName,
                type: type,
                password: password,
                owner: { connect: { id: userOwner.id } },
                members: { create: { user: { connect: { id: userOwner.id } } } },
                admins: { create: { user: { connect: { id: userOwner.id } } } },
            },
        });
        return newGroup;
    }

    //TODO NEED VERIFY GROUP TYPE AND HANDLE CREATE ROLES FOR PRIVATE->INVITE TO GROUP
    async joinGroup(groupActionsDto: GroupActionsDto): Promise<messageToClient> {
        const user = await this.groupService.getUserByUsername(groupActionsDto.username,);
        const group = await this.groupService.getGroupByName(groupActionsDto.groupName,);

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
        return messageToClient;
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

    async inviteToGroup(inviteToGroupDto: InviteToGroupDto) {
        const group = await this.groupService.getGroupByName(inviteToGroupDto.groupName);
        if (group.type !== 'PRIVATE')
            throw new BadRequestException(`Group ${group.name} is not a Private type`)
        const admUser = await this.groupService.getUserByUsername(inviteToGroupDto.admUsername);
        const isAdm = await this.groupService.isAdmInGroup(admUser.id, group.id);
        if (!isAdm)
            throw new BadRequestException(`User ${admUser.user} is not a ADM in Group ${group.name}`);

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

    async setUserAsAdm(setAdm: SetAdm){
        const group = await this.groupService.getGroupByName(setAdm.groupName);
        const adm = await this.groupService.getUserByUsername(setAdm.admUsername);
        const user = await this.groupService.getUserByUsername(setAdm.targetUsername);

        const isAdm = await this.groupService.isAdmInGroup(adm.id, group.id);
        const isUserAdm = await this.groupService.isAdmInGroup(user.id, group.id)
        const isMember = await this.groupService.isMemberInGroup(user.id, group.id);

        if (!isMember)
            throw new BadRequestException(`User ${setAdm.targetUsername} in not a member in group`)
        if (isUserAdm)
            throw new BadRequestException(`User ${setAdm.targetUsername} alredy is a adm in Group`)
        if (!isAdm)
            throw new BadRequestException(`User ${setAdm.admUsername} is not a adm in Group`)

        await this.prisma.groupAdmin.create({
            data: {
                userId: user.id,
                groupId: group.id,
            }
        });
    }

    // TEST 1.2 talves nao precise disso
    //TODO FIX se continuar para nao deletar quem nao pode owner e adm
    async removeAdm(setAdm: SetAdm){
        const group = await this.groupService.getGroupByName(setAdm.groupName);
        const adm = await this.groupService.getUserByUsername(setAdm.admUsername);
        const user = await this.groupService.getUserByUsername(setAdm.targetUsername);

        const isAdm = await this.groupService.isAdmInGroup(adm.id, group.id);
        const isUserAdm = await this.groupService.isAdmInGroup(user.id, group.id)
        const isMember = await this.groupService.isMemberInGroup(user.id, group.id);

        if (!isMember)
            throw new BadRequestException(`${setAdm.targetUsername} in not a member in group`)
        if (!isUserAdm)
            throw new BadRequestException(`${setAdm.targetUsername} is not a adm in Group`)
        if (!isAdm)
            throw new BadRequestException(`${setAdm.admUsername} is not a adm in Group`)

        if(group.ownerId == user.id)
            throw new BadRequestException(`${user.user} the owner can't be removed the from adm list`)

        await this.prisma.groupAdmin.deleteMany({
            where: {
                userId: user.id,
                groupId: group.id,
            }
        });
    }
    //1.3 esse aqui antes owner definir mudar e remover a senha de um canal ver como fica o status do channel se continua protect ou muda
    //1.5.1 definir um leave the channel

    //1.4 assim que owner sair passar o adm
    //1.5.2 kick ban mute
    //
    //convidar para jogar
    //acessar perfil

    async changeChannelPass(passwordChannel: PassowordChannel){
        const owner = await this.groupService.getUserByUsername(passwordChannel.ownerUsername);
        const group = await this.groupService.getGroupByName(passwordChannel.groupName);

        if (group.ownerId !== owner.id)
            throw new BadRequestException(`user ${owner.user} is not the owner in channel ${group.name}`);

        if (passwordChannel.password){
            const password = await argon.hash(passwordChannel.password);
            await this.prisma.group.update({
                where: { id:group.id},
                data: {password: password, type: "PROTECT"}
            });
        } else {
            await this.prisma.group.update({
                where: {id: group.id},
                data: { password: null, type: "PUBLIC"},
            });
        }
    }

    async setChannelOnlyInvite(setOnlyInvite : SetOnlyInvite) {
        const owner = await this.groupService.getUserByUsername(setOnlyInvite.ownerUsername);
        const group = await this.groupService.getGroupByName(setOnlyInvite.groupName);
        if (group.ownerId !== owner.id)
            throw new BadRequestException(`user ${owner.user} is not the owner in channel ${group.name}`);
        await this.prisma.group.update({
            where: { id:group.id},
            data: {password: null, type: "PRIVATE"}
        });
    }

    async leaveChannel(username: string, groupName: string) {
        const user = await this.groupService.getUserByUsername(username);
        const group = await this.groupService.getGroupByName(groupName);

        const isMember = await this.groupService.isMemberInGroup(user.id, group.id);
        if (!isMember)
            throw new BadRequestException(`${user.user} is not a member in ${group.name}`)
        if (group.ownerId == user.id){
            var emptyGroup = await this.passOwner(user, group);
        }

        await this.prisma.groupMembership.deleteMany({
            where: {
                userId: user.id,
                groupId: group.id,
            },
        });
        await this.prisma.groupAdmin.deleteMany({
            where: {
                userId: user.id,
                groupId: group.id,
            },
        });
        if (emptyGroup){
            await this.prisma.group.delete({ where: { id: group.id } });
        }
    }

    async passOwner(user: User, group: Group): Promise<boolean> {
        const admToOwner = await this.prisma.groupAdmin.findFirst({
            where: {
                groupId: group.id,
                NOT: {userId: user.id,},
            },
        });
        if (admToOwner){
            await this.prisma.group.update({
                where: { id: group.id,},
                data: { ownerId: admToOwner.userId,},
            });
        } else {
            const otherMember = await this.prisma.groupMembership.findFirst({
                where: {
                    groupId: group.id,
                    NOT: { userId: user.id, },
                },
            });

            if (otherMember) {
                await this.prisma.group.update({
                    where: { id: group.id },
                    data: { ownerId: otherMember.userId },
                });
                await this.prisma.groupAdmin.create({
                    data: {
                        userId: otherMember.userId,
                        groupId: group.id,
                    },
                });
            } else {
                return true;
            }
        }
        return false;
    }

    //TODO TEST owner kick adm
    async kickUser(kickUser: KickUser){
        const group = await this.groupService.getGroupByName(kickUser.groupName);
        const adm = await this.groupService.getUserByUsername(kickUser.admUsername);
        const target = await this.groupService.getUserByUsername(kickUser.targetUsername);

        const isAdm = await this.groupService.isAdmInGroup(adm.id, group.id);
        const isTargetAdm = await this.groupService.isAdmInGroup(target.id, group.id)
        const isMember = await this.groupService.isMemberInGroup(target.id, group.id);
        if (!isAdm)
            throw new BadRequestException(`${adm.user} is not a adm in ${group.name}`)
        if(isTargetAdm && group.ownerId !== adm.id)
            throw new BadRequestException(`${target.user} is a adm in ${group.name}`)
        if (!isMember)
            throw new BadRequestException(`${target.user} is not a member in ${group.name}`)
        if (group.ownerId == target.id)
            throw new BadRequestException(`${target.user} is the owner from ${group.name}`)
        if (adm.id == target.id)
            throw new BadRequestException(`you can't kick your self'`)

        await this.prisma.groupMembership.deleteMany({
            where: {
                userId: target.id,
                groupId: group.id,
            },
        });
        await this.prisma.groupAdmin.deleteMany({
            where: {
                userId: target.id,
                groupId: group.id,
            },
        });
    }

    //TODO ban mute for limited time; Precisa de volume no db e adaptar algumas funcoes para aceitar isso como mensagem e join
}
