import { Module } from '@nestjs/common';
import { Authentication2faService } from './authentication-2fa.service';
import { Authentication2faController } from './authentication-2fa.controller';
import { UserService } from 'src/user/user.service';

@Module({
    providers: [Authentication2faService, UserService],
    controllers: [Authentication2faController],
})
export class Authentication2faModule {}
