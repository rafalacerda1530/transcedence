import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { messageToClient, messageToServer } from "./dto/chat.interface";
import { CreateGroupDto, GroupActionsDto } from "./dto/chat.dto";
import { GroupService } from "./services/group.service";
import * as argon from 'argon2';

//TODO NEED IMPLEMENT A FRONT END ROOMS AND MESSAGES TO ROOMS JUST SIMPLE
@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly groupService: GroupService,
    ) { }

    //TODO: ver se é nescessario o uso de id
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

    //TODO NEED VERIFY GROUP TYPE AND HANDLE CREATE ROLES FOR PRIVATE PROTECT AND INVITE TO GROUP
    async joinGroup(groupActionsDto: GroupActionsDto): Promise<messageToClient> {
        const user = await this.groupService.getUserByUsername(groupActionsDto.username,);
        const group = await this.groupService.getGroupByName(groupActionsDto.groupName,);

        const permission = await this.groupService.checkUserPermissionGroupType(group, groupActionsDto.password)
        if (!permission)
            throw new BadRequestException('Invalid form for group type')

        await this.groupService.AddMembership(user, group);
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
}
