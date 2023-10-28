import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaCommands } from 'src/prisma/prisma.commands';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [HttpModule, PrismaModule],
    providers: [OauthService],
    controllers: [OauthController]
})
export class OauthModule {}