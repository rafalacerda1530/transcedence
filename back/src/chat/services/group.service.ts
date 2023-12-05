import { BadRequestException, Injectable } from "@nestjs/common";
import { Group, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from 'argon2';

@Injectable()
export class GroupService {
    constructor(private readonly prisma: PrismaService) { }

    async getUserByUsername(username: string): Promise<User> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { user: username },
            });
            if (!user)
                throw new BadRequestException(`User ${username} not found`);
            return user;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async getGroupByName(chatName: string): Promise<Group> {
        try {
            const group = await this.prisma.group.findUnique({
                where: { name: chatName },
            });
            if (!group)
                throw new BadRequestException(`Group ${chatName} not found`);
            return group;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async AddMembership(user: User, group: Group): Promise<void> {
        try {
            const isAlredyMember = await this.prisma.groupMembership.findFirst({
                where: { userId: user.id, groupId: group.id },
            });
            if (isAlredyMember)
                throw new BadRequestException(`User ${user.user} is already a member of the group ${group.name}`,);
            await this.prisma.groupMembership.create({
                data: {
                    user: { connect: { id: user.id } },
                    group: { connect: { id: group.id } },
                },
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    validatePasswordForGroupType(type: string, password: string | null | undefined) {
        try {
            if (type === "PROTECT" && !password)
                throw new BadRequestException('A protect group must have a password');
            if ((type === "PUBLIC" || type === "PRIVATE") && (password != null || undefined))
                throw new BadRequestException(`A ${type.toLowerCase()} group must not have a password`);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async checkUserPermissionGroupType(group: Group, password: string): Promise<boolean> {
        const type = group.type;
        if (type === "PUBLIC" && !password)
            return true;
        //TODO NEED A INVITE
        //TODO PRIVATE CRIA LOGICA DE CONVITES E VER SE O MAN FOI CONVIDADO // TER ROTA PARA CONVITE OBS ALERTAS SAO OUTROS QUINHETOS
        // if (type === "PRIVATE" && this.checkUserPermissionPrivate(user, group) )
        //     return true
        if (type === "PROTECT" && password)
            return await this.checkUserPermissionProtect(group, password);
        return false;
    }

    private async checkUserPermissionProtect(group: Group, password: string): Promise<boolean> {
        return await argon.verify(group.password, password)
    }
}
