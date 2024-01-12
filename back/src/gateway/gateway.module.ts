import { Module } from '@nestjs/common';
import { GameGatewayService } from './game.gateway.service';
import { JwtService } from '@nestjs/jwt';
import { QueueGatewayService } from './queue.gateway.service';

@Module({
  providers: [GameGatewayService, QueueGatewayService, JwtService]
})
export class GatewayModule {}
