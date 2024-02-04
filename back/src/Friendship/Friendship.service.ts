import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserStatus } from '@prisma/client';

interface Friend {
    id: number;
    user: string;
    status: UserStatus;
}

@Injectable()
export class FriendshipService {
    constructor(private readonly prisma: PrismaService) { }

    async addFriendship(userId: number, friendId: number): Promise<void> {
        if (userId === friendId)
            throw new BadRequestException('Cannot add yourself as a friend');
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { followedById: userId, followingId: friendId },
                    { followedById: friendId, followingId: userId },
                ],
            },
        });
        if (existingFriendship) {
            this.prisma.friendship.update({
                where: { id: existingFriendship.id, },
                data: { friendshipStatus: 2 },
            });
        } else {
            this.prisma.friendship.create({
                data: {
                    followedById: userId,
                    followingId: friendId,
                    friendshipStatus: 2,
                },
            })
        }
    }

    async deleteFriendship(userId: number, friendId: number): Promise<void> {
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { followedById: userId, followingId: friendId },
                    { followedById: friendId, followingId: userId },
                ],
            },
        });
        if (!existingFriendship) {
            throw new BadRequestException('Friendship does not exist');
        }

        await this.prisma.friendship.update({
            where: {
                id: existingFriendship.id,
            },
            data: {
                friendshipStatus: 3,
            },
        });
    }

    async getFriends(username: string): Promise<Friend[]> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { user: username },
            });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            const friendships = await this.prisma.friendship.findMany({
                where: {
                    OR: [{ followedById: user.id }, { followingId: user.id }],
                },
                include: {
                    following: true,
                    followedBy: true,
                },
            });

            const friends: Friend[] = friendships.map((friendship) => ({
                id:
                    friendship.followedById === user.id
                        ? friendship.following.id
                        : friendship.followedBy.id,
                user:
                    friendship.followedById === user.id
                        ? friendship.following.user
                        : friendship.followedBy.user,
                status:
                    friendship.followedById === user.id
                        ? friendship.following.status
                        : friendship.followedBy.status,
            }));

            return friends;
        } catch (error) {
            throw new InternalServerErrorException('Error fetching user');
        }
    }

    async getFriendshipStatus(userId: number, friendId: number) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { followedById: userId, followingId: friendId },
                    { followedById: friendId, followingId: userId },
                ],
            },
        });
        return friendship.friendshipStatus;
    }

    async acceptFriendship(userId: number, friendId: number): Promise<void> {
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { followedById: userId, followingId: friendId },
                    { followedById: friendId, followingId: userId },
                ],
            },
        });
        if (!existingFriendship) {
            throw new BadRequestException('Friendship does not exist');
        }

        await this.prisma.friendship.update({
            where: {
                id: existingFriendship.id,
            },
            data: {
                friendshipStatus: 1,
            },
        });
    }

    async rejectFriendship(userId: number, friendId: number): Promise<void> {
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { followedById: userId, followingId: friendId },
                    { followedById: friendId, followingId: userId },
                ],
            },
        });

        if (!existingFriendship) {
            throw new BadRequestException('Friendship does not exist');
        }

        await this.prisma.friendship.update({
            where: {
                id: existingFriendship.id,
            },
            data: {
                friendshipStatus: 0,
            },
        });
    }
}
