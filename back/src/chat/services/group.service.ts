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

    async addMembership(user: User, group: Group): Promise<void> {
        try {
            const isAlredyMember = await this.isMemberInGroup(user.id, group.id);
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

    async checkUserPermissionGroupType(user: User, group: Group, password: string): Promise<boolean> {
        const type = group.type;
        if (type === "PUBLIC" && !password)
            return true;
        if (type === "PRIVATE" && !password)
            return await this.checkUserPermissionPrivate(user.id, group.id);
        if (type === "PROTECT" && password)
            return await this.checkUserPermissionProtect(group, password);
        return false;
    }

    private async checkUserPermissionPrivate(userId: number, groupId: number): Promise<boolean> {
        const invited = await this.checkExistingInviteForUserInGroup(userId, groupId);
        if (!invited) {
            return false;
        }
        await this.prisma.groupInvite.deleteMany({
            where: {
                groupId: groupId,
                invitedUserId: userId,
            },
        });
        return true;
    }

    private async checkUserPermissionProtect(group: Group, password: string): Promise<boolean> {
        return await argon.verify(group.password, password)
    }

    async isAdmInGroup(admId: number, groupId: number): Promise<boolean> {
        const isAdm = await this.prisma.groupAdmin.findFirst({
            where: {
                userId: admId,
                groupId: groupId,
            },
        });
        return !!isAdm;
    }

    async checkExistingInviteForUserInGroup(userId: number, groupId: number): Promise<boolean> {
        const invited = await this.prisma.groupInvite.findFirst({
            where: {
                groupId: groupId,
                invitedUserId: userId,
            },
        });
        return !!invited;
    }

    async isMemberInGroup(userId: number, groupId: number): Promise<boolean> {
        const isAlredyMember = await this.prisma.groupMembership.findFirst({
            where: { userId: userId, groupId: groupId },
        });
        if (isAlredyMember)
            return true;
        return false;

    }
}
