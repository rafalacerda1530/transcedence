import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ChatService } from './chat.service';
import { BlockUser, CreateDmGroup, DeleteDmGroup, InviteToGroupDto } from './dto/chat.dto';
import { GroupService } from './services/group.service';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly groupService: GroupService,

    ) { }

    @Put('inviteToGroup')
    async inviteToGroup(@Body() inviteToGroupDto: InviteToGroupDto) {
        return await this.chatService.inviteToGroupPrivate(inviteToGroupDto);
    }

    @Post('isUserBlocked')
    async isUserBlocked(@Body() blockUser: BlockUser) {
        return await this.groupService.isUserBlocked(blockUser.userUsername, blockUser.targetUsername);
    }

    @Post('createDmGroup')
    async createDmGroup(@Body() groupDm: CreateDmGroup) {
        await this.chatService.createDmGroup(groupDm);
    }

    @Delete('deleteDmGroup')
    async deleteDmGroup(@Body() groupDm: DeleteDmGroup) {
        return await this.chatService.deleteDmGroup(groupDm);
    }

    @Get('getUserGroups/:username')
    async getUserGroups(@Param('username') username: string) {
        return await this.groupService.getUserGroupAndDm(username);
    }

    @Get('allGroups')
    async getAllGroups() {
        return await this.groupService.getAllGroups();
    }

    @Post('allDm')
    async getAllDm(@Body() body: { username: string }) {
        const { username } = body;
        return await this.groupService.getAllDm(username);
    }

    @Get('groupMessages/:groupName')
    async getMessagesInGroup(@Param('groupName') groupName: string) {
        return await this.groupService.getMessagesInGroup(groupName);
    }

    @Get('dmGroupMessages/:groupName')
    async getDmMessagesInGroup(@Param('groupName') groupName: string) {
        return await this.groupService.getDmMessagesInGroup(groupName);
    }

    @Get('groupId/:groupName')
    async getGroupByName(@Param('groupName') groupName: string) {
        return await this.groupService.getGroupByName(groupName);
    }

    @Get('UserId/:groupName')
    async getUserByName(@Param('groupName') userName: string) {
        return await this.groupService.getUserByUsername(userName);
    }

    @Get('CheckInvitationForUserGroup/:userId/:groupId')
    async getInvitation(@Param('groupId') groupId: number, @Param('userId') userId: number) {
        const userIdN = Number(userId);
        const groupIdN = Number(groupId);
        return await this.groupService.checkExistingInviteForUserInGroup(userIdN, groupIdN);
    }

    @Get('ban/list/:groupName')
    async getBanList(@Param('groupName') groupName: string) {
        return await this.groupService.getBanList(groupName);
    }

    @Get('blockedList/:username')
    async getBlockList(@Param('username') username: string) {
        return await this.groupService.getBlockedListUser(username);
    }

    @Get('direct-chat/:groupName/members')
    async getDMgroupMembers(@Param('groupName') groupName: string) {

        return await this.groupService.getDMgroupMembers(groupName);
    }

}
