import { Controller, Post, Delete, Param, Get } from '@nestjs/common';
import { FriendshipService } from './Friendship.service';
// import { AuthGuard } from '@nestjs/passport';

const statusMappings = {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    IN_GAME: 'In Game',
    IN_QUEUE: 'In Queue',
};

@Controller('friendship')
// @UseGuards(AuthGuard('jwt'))
export class FriendshipController {
    constructor(private readonly friendshipService: FriendshipService) {}

    @Post(':userId/status/:friendId')
    async getFriendshipStatus(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
    ) {
        const friendshipStatus =
            await this.friendshipService.getFriendshipStatus(
                parseInt(userId, 10),
                parseInt(friendId, 10),
            );
        return friendshipStatus;
    }

    @Post(':userId/accept/:friendId')
    async acceptFriendship(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
    ): Promise<void> {
        await this.friendshipService.acceptFriendship(
            parseInt(userId, 10),
            parseInt(friendId, 10),
        );
    }

    @Post(':userId/reject/:friendId')
    async rejectFriendship(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
    ): Promise<void> {
        await this.friendshipService.rejectFriendship(
            parseInt(userId, 10),
            parseInt(friendId, 10),
        );
    }

    @Post(':userId/add/:friendId')
    async addFriendship(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
    ): Promise<void> {
        try {
            const envio = await this.friendshipService.addFriendship(
                parseInt(userId, 10),
                parseInt(friendId, 10),
            );
        } catch (err) {
            console.log('error: ', err);
        }
    }

    @Delete(':userId/delete/:friendId')
    async deleteFriendship(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
    ): Promise<void> {
        await this.friendshipService.deleteFriendship(
            parseInt(userId, 10),
            parseInt(friendId, 10),
        );
    }

    @Get(':username')
    async getFriends(
        @Param('username') username: string,
    ): Promise<{ id: number; user: string; status: string }[]> {
        const friends = await this.friendshipService.getFriends(username);
        return friends.map(({ id, user, status }) => ({
            id,
            user,
            status: statusMappings[status],
        }));
    }
	@Get('Pendentes/:username')
    async getFriendsPend(
        @Param('username') username: string,
    ): Promise<{ id: number; user: string; status: string }[]> {
        const friends = await this.friendshipService.getFriendsPend(username);
        return friends.map(({ id, user, status }) => ({
            id,
            user,
            status: statusMappings[status],
        }));
    }
}
