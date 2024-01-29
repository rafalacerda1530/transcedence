import { Body, Controller, Post } from '@nestjs/common'
import { ChatService } from './chat.service';
import { CreateGroupDto, InviteToGroupDto, SetAdm} from './dto/chat.dto';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('createGroup')
    async createGroup(@Body() createGroupDto: CreateGroupDto) {
        return await this.chatService.createGroup(createGroupDto);
    }

    //TODO 2024 1 -criar metedos para add admin delete admin set pass ban mute ...


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
}
