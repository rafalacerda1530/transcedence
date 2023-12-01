import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { messageToClient, messageToServer } from './chat.interface';

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) { }

    async saveMessage(messageToServer: messageToServer) {
        const user = await this.prisma.user.findUnique({
            where: { user: messageToServer.user },
        });
        if (!user || !messageToServer.message)
            throw new BadRequestException('Invalid request saveMessage')

        const messageDB = await this.prisma.message.create({
            data: {
                sender: {
                    connect: {
                        id: user.id,
                    },
                },
                date: new Date(),
                content: messageToServer.message,
            },
        });
        //answer front-end
        const messageToClient: messageToClient = {
            id: messageDB.id,
            user: { login: user.user },
            message: messageDB.content,
            date: messageDB.date,
        };
        return messageToClient;
    }
}
