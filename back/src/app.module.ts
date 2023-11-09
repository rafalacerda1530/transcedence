import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthDto } from './dto/auth.dto';
import { PrismaModule } from './prisma/prisma.module';
import { OauthModule } from './oauth/oauth.module';


@Module({
  imports: [AuthModule, AuthDto, PrismaModule, ConfigModule.forRoot({isGlobal: true}), OauthModule],
})
export class AppModule {}
