import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClient, User } from '@prisma/client';
@Injectable()
export class FriendshipService {
    constructor(private readonly prisma: PrismaService) { }

    async addFriendship(userId: number, friendId: number): Promise<void> {
        await this.prisma.friendship.create({
            data: {
                followedById: userId,
                followingId: friendId,
            },
        });

        await this.prisma.friendship.create({
            data: {
                followedById: friendId,
                followingId: userId,
            },
        });
    }

    async deleteFriendship(userId: number, friendId: number): Promise<void> {
        await this.prisma.friendship.deleteMany({
            where: {
                followedById: userId,
                followingId: friendId,
            },
        });

        await this.prisma.friendship.deleteMany({
            where: {
                followedById: friendId,
                followingId: userId,
            },
        });
    }

    async getFriends(username: string): Promise<User[]> {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const friendships = await this.prisma.friendship.findMany({
            where: { followedById: user.id },
        });

        const friendUserIds = friendships.map((friendship) => friendship.followingId);

        return this.prisma.user.findMany({
            where: { id: { in: friendUserIds } },
        });
    }
}