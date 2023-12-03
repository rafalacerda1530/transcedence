import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { GroupService } from './services/group.service';

@Module({
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, GroupService],
  exports: [ChatService, GroupService]
})
export class ChatModule { }
