import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClient, User, Friendship } from '@prisma/client';

interface Friend {
    id: number;
    user: string;
}

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

    async getFriends(username: string): Promise<Friend[]> {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const friendships = await this.prisma.friendship.findMany({
            where: { followedById: user.id },
            include: {
                following: {
                    select: {
                        id: true,
                        user: true,
                    },
                },
            },
        });
        const friends: Friend[] = friendships.map((friendship) => ({
            id: friendship.following.id,
            user: friendship.following.user,
        }));
    
        return friends;
    }
}