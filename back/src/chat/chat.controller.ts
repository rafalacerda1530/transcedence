import { Body, Controller, Post } from '@nestjs/common'
import { ChatService } from './chat.service';
import { BanUser, CreateGroupDto, InviteToGroupDto, KickUser, PassowordChannel, SetAdm, SetOnlyInvite } from './dto/chat.dto';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
// TODO MUDAR OS METODOS POST PARA O IDEAL
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

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

}
