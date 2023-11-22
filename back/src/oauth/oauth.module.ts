import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TokenService } from 'src/token/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [OauthService, TokenService, JwtService],
  controllers: [OauthController],
})
export class OauthModule {}
