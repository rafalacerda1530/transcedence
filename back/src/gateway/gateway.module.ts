import { Module } from '@nestjs/common';
import { GameGatewayService } from './game.gateway.service';
import { JwtService } from '@nestjs/jwt';
import { QueueGatewayService } from './queue.gateway.service';
import { StatusGatewayService } from './status.gateway.service';
import { GameInviteGatewayService } from './gameInvite.gateway.service';

@Module({
  providers: [GameGatewayService, QueueGatewayService, StatusGatewayService, JwtService, GameInviteGatewayService]
})
export class GatewayModule {}
