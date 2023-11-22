import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthDto } from './dto/auth.dto';
import { PrismaModule } from './prisma/prisma.module';
import { OauthModule } from './oauth/oauth.module';
import { TokenModule } from './token/token.module';
import { UserModule } from './user/user.module';
import { Authentication2faModule } from './2fa-authentication/authentication-2fa.module';

@Module({
  imports: [
    AuthModule,
    AuthDto,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    OauthModule,
    TokenModule,
    UserModule,
    Authentication2faModule,
  ],
})
export class AppModule {}
