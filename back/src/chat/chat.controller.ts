import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ChatService } from './chat.service';
import { BanUser, BlockUser, CreateDmGroup, CreateGroupDto, DeleteDmGroup, GetMembers, GroupActionsDto, InviteToGroupDto, JoinGroupDto, KickUser, MuteUser, PassowordChannel, SetAdm, SetOnlyInvite } from './dto/chat.dto';
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

    @Put('blockUser')
    async blockUser(@Body() blockUser: BlockUser) {
        return await this.chatService.blockUser(blockUser);
    }

    @Put('removeBlock')
    async removeBlock(@Body() blockUser: BlockUser) {
        return await this.chatService.removeBlock(blockUser);
    }

    @Post('isUserBlocked')
    async isUserBlocked(@Body() blockUser: BlockUser) {
        return await this.groupService.isUserBlocked(blockUser.userUsername, blockUser.targetUsername);
    }

    @Post('createDmGroup')
    async createDmGroup(@Body() groupDm: CreateDmGroup) {
        return await this.chatService.createDmGroup(groupDm);
    }

    @Delete('deleteDmGroup')
    async deleteDmGroup(@Body() groupDm: DeleteDmGroup) {
        return await this.chatService.deleteDmGroup(groupDm);
    }

    @Get('getUserGroups/:username')
    async getUserGroups(@Param('username') username: string) {
        return await this.groupService.getUserGroupAndDm(username);
    }

    // @Post('membersInChat')
    // async getMembersInChat(@Body() getMembers: GetMembers) {
    //     return await this.groupService.getMembersInChat(getMembers);
    // }

    //TODO TEST
    @Get('allGroups')
    async getAllGroups() {
        return await this.groupService.getAllGroups();
    }

    @Get('groupMessages/:groupName')
    async getMessagesInGroup(@Param('groupName') groupName: string) {
        return await this.groupService.getMessagesInGroup(groupName);
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
    async getBanList(@Param('groupName') groupName: string){
        return await this.groupService.getBanList(groupName);
    }

}
