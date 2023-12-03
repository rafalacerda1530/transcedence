import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { messageToClient, messageToServer } from "./chat.interface";
import { ChatActionsDto, CreateGroupDto } from "./dto/chat.dto";

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) { }


    //TODO: ACEITAR A ENTRADA DE CHAT do "dto" E LIDAR COM ISTO E VER SE REALMENTE E NESCESSARIO O USO DE ID NO messageToClient

    async saveMessage(messageToServer: messageToServer) {
        const user = await this.prisma.user.findUnique({
            where: { user: messageToServer.user },
        });
        if (!user || !messageToServer.message)
            throw new BadRequestException("Invalid request saveMessage");

        const messageDB = await this.prisma.message.create({
            data: {
                sender: {
                    connect: {
                        id: user.id,
                    },
                },
                date: new Date(),
                content: messageToServer.message,
            },
        });
        //answer front-end
        const messageToClient: messageToClient = {
            id: messageDB.id,
            user: user.user,
            message: messageDB.content,
            date: messageDB.date,
        };
        return messageToClient;
    }


    //TODO:refatorar essas funcoes


    async createGroup({ type, name, ownerName, password }: CreateGroupDto) {
        const userOwner = await this.prisma.user.findUnique({
            where: { user: ownerName },
        });
        if (!userOwner)
            throw new BadRequestException("User not found |createGroup|");
        if (type === "PRIVATE" && !password)
            throw new BadRequestException(
                "A private group must have a password |createGroup|",
            );
        if (type === "PUBLIC" && password !== null)
            throw new BadRequestException(
                "A public group must not have a password |createGroup|",
            );
        if (type === "PROTECT" && password !== null)
            throw new BadRequestException(
                "A protect group must not have a password |createGroup|",
            );
        const newGroup = await this.prisma.group.create({
            data: {
                name: name,
                type: type,
                password: password,
                members: { create: { user: { connect: { id: userOwner.id } } } },
                admins: { create: { user: { connect: { id: userOwner.id } } } },
            },
        });
        return newGroup;
    }

    async joinGroup({ username, chatName }: ChatActionsDto) {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });
        const group = await this.prisma.group.findUnique({
            where: { name: chatName },
        });
        if (!user || !group)
            throw new BadRequestException("Invalid request |joinGroup|");

        const isAlredyMember = await this.prisma.groupMembership.findFirst({
            where: {
                userId: user.id,
                groupId: group.id,
            },
        });
        if (isAlredyMember) {
            throw new BadRequestException(
                `User ${username} is already a member of the group ${chatName}`,
            );
        }
        await this.prisma.groupMembership.create({
            data: {
                user: { connect: { id: user.id } },
                group: { connect: { id: group.id } },
            },
        });

        const messageToClient: messageToClient = {
            chat: chatName,
            user: username,
            message: "joined in the group",
            date: new Date(Date.now()),
        };
        return messageToClient;
    }
}
