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

    @Post('createGroup')
    async createGroup(@Body() createGroupDto: CreateGroupDto) {
        return await this.chatService.createGroup(createGroupDto);
    }

    @Put('inviteToGroup')
    async inviteToGroup(@Body() inviteToGroupDto: InviteToGroupDto) {
        return await this.chatService.inviteToGroup(inviteToGroupDto);
    }

    @Put('setUserAsAdm')
    async setUserAsAdm(@Body() setAdm: SetAdm) {
        return await this.chatService.setUserAsAdm(setAdm);
    }

    @Put('removeUserAsAdm')
    async removeUserAsAdm(@Body() setAdm: SetAdm) {
        return await this.chatService.removeAdm(setAdm);
    }

    @Post('changeChannelPass')
    async changeChannelPass(@Body() passowordChannel: PassowordChannel) {
        return await this.chatService.changeChannelPass(passowordChannel);
    }

    @Put('setChannelOnlyInvite')
    async setChannelOnlyInvite(@Body() setOnlyInvite: SetOnlyInvite) {
        return await this.chatService.setChannelOnlyInvite(setOnlyInvite);
    }

    @Put('kickUser')
    async kickUser(@Body() kickUser: KickUser) {
        return await this.chatService.kickUser(kickUser);
    }

    @Put('banUser')
    async banUser(@Body() banUser: BanUser) {
        return await this.chatService.banUser(banUser);
    }

    @Put('removeBan')
    async removeBan(@Body() banUser: BanUser) {
        return await this.chatService.removeBanCommand(banUser);
    }

    @Put('muteUser')
    async muteUser(@Body() muteUser: MuteUser) {
        return await this.chatService.muteUser(muteUser);
    }

    @Put('removeMute')
    async removeMute(@Body() muteUser: MuteUser) {
        return await this.chatService.removeMute(muteUser);
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

    @Post('membersInChat')
    async getMembersInChat(@Body() getMembers: GetMembers) {
        return await this.groupService.getMembersInChat(getMembers);
    }

    //TODO TEST
    @Get('allGroups')
    async getAllGroups() {
        return await this.groupService.getAllGroups();
    }

    @Get('groupMessages/:groupName')
    async getMessagesInGroup(@Param('groupName') groupName: string) {
        return await this.groupService.getMessagesInGroup(groupName);
    }
}
