import { Controller, Post, Delete, Param, Get, UseGuards } from '@nestjs/common';
import { FriendshipService } from './Friendship.service';
import { User } from '@prisma/client';
// import { AuthGuard } from '@nestjs/passport';


@Controller('friendship')
// @UseGuards(AuthGuard('jwt'))
export class FriendshipController {
    constructor(private readonly friendshipService: FriendshipService) { }

    @Post(':userId/add/:friendId')
    async addFriendship(@Param('userId') userId: string, @Param('friendId') friendId: string,): Promise<void> {
        await this.friendshipService.addFriendship(parseInt(userId, 10), parseInt(friendId, 10));
    }

    @Delete(':userId/delete/:friendId')
    async deleteFriendship(@Param('userId') userId: string, @Param('friendId') friendId: string,): Promise<void> {
        await this.friendshipService.deleteFriendship(parseInt(userId, 10), parseInt(friendId, 10));
    }

    @Get(':username')
    async getFriends(@Param('username') username: string): Promise<{ id: number; user: string }[]> {
        const friends = await this.friendshipService.getFriends(username);
        return friends.map(({ id, user }) => ({ id, user }));
    }
}