import { Body, Controller, Post } from '@nestjs/common'
import { ChatService } from './chat.service';
import { CreateGroupDto } from './dto/chat.dto';

@Controller('api/chat')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('createGroup')
    async createGroup(@Body() createGroupDto: CreateGroupDto) {
        console.log(createGroupDto);
        return await this.chatService.createGroup(createGroupDto);
    }
    //TODO criar metedos para add admin delete admin set pass ban mute ...
}
