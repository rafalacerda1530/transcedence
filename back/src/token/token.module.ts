import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { JwtService } from '@nestjs/jwt';
import { RefreshStrategy } from 'src/strategies/rt.strategy';

@Module({
    providers: [TokenService, JwtService, RefreshStrategy],
    controllers: [TokenController],
})
export class TokenModule {}
