import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthDto } from './dto/auth.dto';
import { PrismaModule } from './prisma/prisma.module';
import { OauthModule } from './oauth/oauth.module';
import { TokenModule } from './token/token.module';


@Module({
  imports: [AuthModule, AuthDto, PrismaModule, ConfigModule.forRoot({isGlobal: true}), OauthModule, TokenModule],
})
export class AppModule {}
