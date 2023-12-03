import { BadRequestException, Injectable } from "@nestjs/common";
import { Group, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class GroupService {
    constructor(private readonly prisma: PrismaService) { }

    async getUserByUsername(username: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });
        if (!user) {
            throw new BadRequestException(`User ${username} not found`);
        }
        return user;
    }

    async getGroupByName(chatName: string): Promise<Group> {
        const group = await this.prisma.group.findUnique({
            where: { name: chatName },
        });
        if (!group) {
            throw new BadRequestException(`Group ${chatName} not found`);
        }
        return group;
    }

    async checkAndAddMembership(user: User, group: Group): Promise<void> {
        const isAlredyMember = await this.prisma.groupMembership.findFirst({
            where: { userId: user.id, groupId: group.id },
        });
        if (isAlredyMember) {
            throw new BadRequestException(
                `User ${user.user} is already a member of the group ${group.name}`,
            );
        }
        await this.prisma.groupMembership.create({
            data: {
                user: { connect: { id: user.id } },
                group: { connect: { id: group.id } },
            },
        });
    }

    validatePasswordForGroupType(type: string, password: string | null) {
    if (type === "PRIVATE" && !password) {
        throw new BadRequestException('A private group must have a password');
    }

    if ((type === "PUBLIC" || type === "PROTECT") && password !== null) {
        throw new BadRequestException(`A ${type.toLowerCase()} group must not have a password`);
    }
}
}
