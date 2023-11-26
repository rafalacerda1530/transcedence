import { Module } from '@nestjs/common';
import { FriendshipController } from './Friendship.controller';
import { FriendshipService } from './Friendship.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    controllers: [FriendshipController],
    providers: [FriendshipService, PrismaService],
})
export class FriendshipModule { }