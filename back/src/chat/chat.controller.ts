import { Body, Controller, Post } from '@nestjs/common'
import { ChatService } from './chat.service';
import { CreateGroupDto, InviteToGroupDto, PassowordChannel, SetAdm, SetOnlyInvite} from './dto/chat.dto';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('createGroup')
    async createGroup(@Body() createGroupDto: CreateGroupDto) {
        return await this.chatService.createGroup(createGroupDto);
    }

    //TODO 2024 1 -criar metedos para  ban mute ...


    //TODO ??????? FIX TALVES o ACCEPT NAO SEJA A MELHOR MANEIRA POR HTTP MELHOR FAZER POR SOCKET
    @Post('inviteToGroup')
    async inviteToGroup(@Body() inviteToGroupDto: InviteToGroupDto) {
        return await this.chatService.inviteToGroup(inviteToGroupDto);
    }

    //!!!! importante é saber de que maneira o set adm ou remove adm vai ser feito a melhor maneira seria o front ter botoes de acoes
    //TODO 1.1. comencado aqui primeiro criar as tags de adm para varias pessoas e dps implementar metodos para testar se funcionou
    @Post('setUserAsAdm')
    async setUserAsAdm(@Body() setAdm: SetAdm){
        return await this.chatService.setUserAsAdm(setAdm);
    }

    @Post('removeUserAsAdm')
    async removeUserAsAdm(@Body() setAdm: SetAdm){
        return await this.chatService.removeAdm(setAdm);
    }

    @Post('changeChannelPass')
    async changeChannelPass(@Body() passowordChannel: PassowordChannel){
        return await this.chatService.changeChannelPass(passowordChannel);
    }

    @Post('setChannelOnlyInvite')
    async setChannelOnlyInvite(@Body() setOnlyInvite: SetOnlyInvite){
        return await this.chatService.setChannelOnlyInvite(setOnlyInvite);
    }
}
