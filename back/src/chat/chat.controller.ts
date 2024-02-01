import { Body, Controller, Post } from '@nestjs/common'
import { ChatService } from './chat.service';
import { BanUser, BlockUser, CreateGroupDto, InviteToGroupDto, KickUser, MuteUser, PassowordChannel, SetAdm, SetOnlyInvite } from './dto/chat.dto';
import { GroupService } from './services/group.service';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
// TODO MUDAR OS METODOS POST PARA O IDEAL
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly groupService: GroupService,

    ) { }

    @Post('createGroup')
    async createGroup(@Body() createGroupDto: CreateGroupDto) {
        return await this.chatService.createGroup(createGroupDto);
    }

    //TODO ??????? FIX TALVES o ACCEPT NAO SEJA A MELHOR MANEIRA POR HTTP MELHOR FAZER POR SOCKET
    @Post('inviteToGroup')
    async inviteToGroup(@Body() inviteToGroupDto: InviteToGroupDto) {
        return await this.chatService.inviteToGroup(inviteToGroupDto);
    }

    @Post('setUserAsAdm')
    async setUserAsAdm(@Body() setAdm: SetAdm) {
        return await this.chatService.setUserAsAdm(setAdm);
    }

    @Post('removeUserAsAdm')
    async removeUserAsAdm(@Body() setAdm: SetAdm) {
        return await this.chatService.removeAdm(setAdm);
    }

    @Post('changeChannelPass')
    async changeChannelPass(@Body() passowordChannel: PassowordChannel) {
        return await this.chatService.changeChannelPass(passowordChannel);
    }

    @Post('setChannelOnlyInvite')
    async setChannelOnlyInvite(@Body() setOnlyInvite: SetOnlyInvite) {
        return await this.chatService.setChannelOnlyInvite(setOnlyInvite);
    }

    @Post('kickUser')
    async kickUser(@Body() kickUser: KickUser) {
        return await this.chatService.kickUser(kickUser);
    }

    @Post('banUser')
    async banUser(@Body() banUser: BanUser) {
        return await this.chatService.banUser(banUser);
    }

    @Post('removeBan')
    async removeBan(@Body() banUser: BanUser) {
        return await this.chatService.removeBanCommand(banUser);
    }

    @Post('muteUser')
    async muteUser(@Body() muteUser: MuteUser) {
        return await this.chatService.muteUser(muteUser);
    }

    @Post('removeMute')
    async removeMute(@Body() muteUser: MuteUser) {
        return await this.chatService.removeMute(muteUser);
    }

    @Post('blockUser')
    async blockUser(@Body() blockUser: BlockUser) {
        return await this.chatService.blockUser(blockUser);
    }

    @Post('removeBlock')
    async removeBlock(@Body() blockUser: BlockUser) {
        return await this.chatService.removeBlock(blockUser);
    }

    @Post('isUserBlocked')
    async isUserBlocked(@Body() blockUser: BlockUser) {
        return await this.groupService.isUserBlocked(blockUser.userUsername, blockUser.targetUsername);
    }
}
