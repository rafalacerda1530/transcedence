import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { messageToClient, messageToServer } from "./dto/chat.interface";
import { CreateGroupDto, GroupActionsDto } from "./dto/chat.dto";
import { GroupService } from "./services/group.service";

@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly groupService: GroupService,
    ) { }

    //TODO: ver se é nescessario o uso de id
    async saveMessage(messageToServer: messageToServer) {
        const user = await this.groupService.getUserByUsername(
            messageToServer.username,
        );
        const chat = await this.groupService.getGroupByName(
            messageToServer.groupName,
        );
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

        const newGroup = await this.prisma.group.create({
            data: {
                name: groupName,
                type: type,
                password: password,
                members: { create: { user: { connect: { id: userOwner.id } } } },
                admins: { create: { user: { connect: { id: userOwner.id } } } },
            },
        });
        return newGroup;
    }

    async joinGroup(groupActionsDto: GroupActionsDto): Promise<messageToClient> {
        const user = await this.groupService.getUserByUsername(groupActionsDto.username);
        const group = await this.groupService.getGroupByName(groupActionsDto.groupName);

        await this.groupService.checkAndAddMembership(user, group);
        const messageToClient: messageToClient = {
            groupName: user.user,
            username: group.name,
            message: "joined in the group",
            date: new Date(Date.now()),
        };
        return messageToClient;
    }
}
