import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AccessStrategy } from 'src/strategies/at.strategy';

@Module({
  providers: [UserService, AccessStrategy],
  controllers: [UserController]
})
export class UserModule {}
