import { Body, Controller, Post } from '@nestjs/common'
import { ChatService } from './chat.service';
import { CreateGroupDto, InviteToGroupDto } from './dto/chat.dto';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('createGroup')
    async createGroup(@Body() createGroupDto: CreateGroupDto) {
        return await this.chatService.createGroup(createGroupDto);
    }

    //TODO criar metedos para add admin delete admin set pass ban mute ...


    //TODO FIX TALVES o ACCEPT NAO SEJA A MELHOR MANEIRA POR HTTP MELHOR FAZER POR SOCKET
    @Post('inviteToGroup')
    async inviteToGroup(@Body() inviteToGroupDto: InviteToGroupDto) {
        return await this.chatService.inviteToGroup(inviteToGroupDto);
    }
}
