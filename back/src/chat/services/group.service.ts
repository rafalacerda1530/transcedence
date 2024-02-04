import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Group, GroupDM, GroupStatus, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from 'argon2';
import { GetMembers, JoinGroupDto } from "../dto/chat.dto";

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

    async getDmGroupByName(groupName: string): Promise<GroupDM> {
        try {
            const group = await this.prisma.groupDM.findUnique({
                where: { name: groupName },
            });
            if (!group)
                throw new BadRequestException(`Group ${groupName} not found`);
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

    async deleteUserFromGroup(targetId: number, groupId: number) {
        await this.prisma.groupMembership.deleteMany({
            where: {
                userId: targetId,
                groupId: groupId,
            },
        });
        await this.prisma.groupAdmin.deleteMany({
            where: {
                userId: targetId,
                groupId: groupId,
            },
        });
    }

    async validateAdmActions(adm: User, target: User, group: Group) {
        try {
            const isAdm = await this.isAdmInGroup(adm.id, group.id);
            const isTargetAdm = await this.isAdmInGroup(target.id, group.id)
            const isMember = await this.isMemberInGroup(target.id, group.id);

            if (!isAdm)
                throw new BadRequestException(`${adm.user} is not a adm in ${group.name}`)
            if (isTargetAdm && group.ownerId !== adm.id)
                throw new BadRequestException(`${target.user} is a adm in ${group.name}`)
            if (!isMember)
                throw new BadRequestException(`${target.user} is not a member in ${group.name}`)
            if (group.ownerId == target.id)
                throw new BadRequestException(`${target.user} is the owner from ${group.name}`)
            if (adm.id == target.id)
                throw new BadRequestException(`you cannot do it in your self'`)
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async isUserBanned(UserId: number, groupId: number): Promise<boolean> {
        const ban = await this.prisma.ban.findFirst({
            where: { userId: UserId, groupId: groupId, },
        });
        if (!ban)
            return false;
        if (ban.expirationDate === null)
            return true;
        if (ban.expirationDate <= new Date()) {
            await this.prisma.ban.delete({ where: { id: ban.id, }, });
            return false;
        }
        return true;
    }

    async passOwner(user: User, group: Group): Promise<boolean> {
        const admToOwner = await this.prisma.groupAdmin.findFirst({
            where: {
                groupId: group.id,
                NOT: { userId: user.id, },
            },
        });
        if (admToOwner) {
            await this.prisma.group.update({
                where: { id: group.id, },
                data: { ownerId: admToOwner.userId, },
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

    async isUserMutted(targetName: string, groupName: string): Promise<boolean> {
        const target = await this.getUserByUsername(targetName);
        const group = await this.getGroupByName(groupName);
        const mute = await this.prisma.mute.findFirst({
            where: { userId: target.id, groupId: group.id, },
        });
        if (!mute)
            return false;
        if (mute.expirationDate === null)
            return true;
        if (mute.expirationDate <= new Date()) {
            await this.prisma.mute.delete({ where: { id: mute.id, }, });
            return false;
        }
        return true;
    }

    async isUserBlocked(userUsername: string, targetName: string): Promise<boolean> {
        const user = await this.getUserByUsername(userUsername);
        const target = await this.getUserByUsername(targetName);
        const block = await this.prisma.block.findFirst({
            where: {
                userId: user.id,
                blockedUserId: target.id,
            },
        });
        return !!block;
    }

    async DmIsUserBlocked(groupName: string): Promise<boolean> {
        const [userA, userB] = await this.getUserByDmGroup(groupName)

        const block = await this.prisma.block.findFirst({
            where: {
                OR: [
                    { userId: userA, blockedUserId: userB },
                    { userId: userB, blockedUserId: userA },
                ],
            },
        });
        return !!block;
    }

    async getUserByDmGroup(groupName: string) {
        const groupDm = await this.prisma.groupDM.findUnique({
            where: {
                name: groupName,
            },
            include: { members: true },
        });
        const users = groupDm.members.map(member => member.userId)
        return users;
    }

    async getUserGroupAndDm(userUsername: string) {
        const user = await this.getUserByUsername(userUsername);

        const groupMembership = await this.prisma.groupMembership.findMany({
            where: { userId: user.id, },
            include: { group: true, groupDM: true }
        });

        if (groupMembership.length === 0) {
            return;
        }
        const groupNames: { name: string, type: GroupStatus }[] = [];
        for (const membership of groupMembership) {
            const targetGroupName = membership.group?.name ?? membership.groupDM?.name;
            const targetType = membership.group ? membership.group.type : membership.groupDM.type;
            if (targetGroupName)
                groupNames.push({ name: targetGroupName, type: targetType });
        }
        return groupNames;
    }

    async getMembersInChat(getMembers: GetMembers) {
        const { groupName, type } = getMembers;
        if (type == 'DIRECT') {
            const DmMembers = await this.prisma.groupDM.findUnique({ where: { name: groupName } }).members();
            if (DmMembers) {
                const dmMemberUsernames = await Promise.all(
                    DmMembers.map(async (member) => {
                        const user = await this.prisma.user.findUnique({
                            where: { id: member.userId },
                            select: { user: true },
                        });
                        return user?.user;
                    })
                );
                return dmMemberUsernames.filter((username) => username); // Filtra quaisquer valores nulos
            }
        } else {
            const groupMembers = await this.prisma.group.findUnique({ where: { name: groupName } }).members();
            if (groupMembers) {
                const groupMemberUsernames = await Promise.all(
                    groupMembers.map(async (member) => {
                        const user = await this.prisma.user.findUnique({
                            where: { id: member.userId },
                            select: { user: true },
                        });
                        return user?.user;
                    })
                );
                return groupMemberUsernames.filter((username) => username);
            }
        }
    }

    async getPublicGroups () {
        const groupsOfType: Group[] = await this.prisma.group.findMany({
            where: {
              type: GroupStatus.PUBLIC,
            },
          });
          console.log(groupsOfType)
        return groupsOfType;
    }

    //async joinGroup(joinGroupDto: JoinGroupDto, prisma: PrismaService = this.prisma) {
    //    try {
    //        const { groupName, type } = joinGroupDto;
    //        const userId = joinGroupDto.user;
    //
    //        // Use uma transação para garantir atomicidade
    //        await prisma.$transaction(async (prisma) => {
    //            // Verifique se o grupo existe
    //            const group = await prisma.group.findUnique({ where: { name: groupName } });
    //            if (!group) {
    //                throw new NotFoundException('Group not found');
    //            }
    //
    //            // Verifique se o usuário já é membro do grupo
    //            const existingMembership = await prisma.groupMembership.findFirst({
    //                where: { groupId: group.id}, // Converta userId para número
    //            });
    //            if (existingMembership) {
    //                throw new ConflictException('User is already a member of the group');
    //            }
    //
    //            // Crie uma nova entrada na tabela GroupMembership para representar a associação do usuário ao grupo
    //            await prisma.groupMembership.create({
    //                data: { groupId: group.id, userId: Number(userId) }, // Converta userId para número
    //            });
    //        });
    //
    //        return { message: 'User joined the group successfully' };
    //    } catch (error) {
    //        console.error('Error joining group:', error);
    //        throw new InternalServerErrorException('Internal Server Error');
    //    }
    //}
}
