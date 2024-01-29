import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { messageToClient, messageToServer } from "./dto/chat.interface";
import { CreateGroupDto, GroupActionsDto, InviteToGroupDto, PassowordChannel, SetAdm } from "./dto/chat.dto";
import { GroupService } from "./services/group.service";
import * as argon from 'argon2';

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
    //TODO 2024 1- precisa verificar se ja esta criando a role de adm e a partir disso criar comandos para certas acoes
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

    // TEST
    async setUserAsAdm(setAdm: SetAdm){
        const group = await this.groupService.getGroupByName(setAdm.groupName);
        const adm = await this.groupService.getUserByUsername(setAdm.admUsername);
        const user = await this.groupService.getUserByUsername(setAdm.userToBeAdm);

        const isAdm = await this.groupService.isAdmInGroup(adm.id, group.id);
        const isUserAdm = await this.groupService.isAdmInGroup(user.id, group.id)
        const isMember = await this.groupService.isMemberInGroup(user.id, group.id);

        if (!isMember)
            throw new BadRequestException(`User ${setAdm.userToBeAdm} in not a member in group`)
        if (isUserAdm)
            throw new BadRequestException(`User ${setAdm.userToBeAdm} alredy is a adm in Group`)
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
    async removeAdm(setAdm: SetAdm){
        const group = await this.groupService.getGroupByName(setAdm.groupName);
        const adm = await this.groupService.getUserByUsername(setAdm.admUsername);
        const user = await this.groupService.getUserByUsername(setAdm.userToBeAdm);

        const isAdm = await this.groupService.isAdmInGroup(adm.id, group.id);
        const isUserAdm = await this.groupService.isAdmInGroup(user.id, group.id)
        const isMember = await this.groupService.isMemberInGroup(user.id, group.id);

        if (!isMember)
            throw new BadRequestException(`User ${setAdm.userToBeAdm} in not a member in group`)
        if (!isUserAdm)
            throw new BadRequestException(`User ${setAdm.userToBeAdm} is not a adm in Group`)
        if (!isAdm)
            throw new BadRequestException(`User ${setAdm.admUsername} is not a adm in Group`)

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

    //TEST com e sem senha
    async changeChannelPass(passwordChannel: PassowordChannel){
        const owner = await this.groupService.getUserByUsername(passwordChannel.ownerUsername);
        const group = await this.groupService.getGroupByName(passwordChannel.groupName);

        if (group.ownerId !== owner.id)
            throw new BadRequestException(`user ${owner.user} is not the owner in channel ${group.name}`);

        if (passwordChannel.password){
            await this.prisma.group.update({
                where: { id:group.id},
                data: {password: passwordChannel.password}
            });
        } else {
            await this.prisma.group.update({
                where: {id: group.id},
                data: { password: null},
            });
        }
    }
}
