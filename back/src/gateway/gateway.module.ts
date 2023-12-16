import { Module } from '@nestjs/common';
import { GameGatewayService } from './game.gateway.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [GameGatewayService, JwtService]
})
export class GatewayModule {}
