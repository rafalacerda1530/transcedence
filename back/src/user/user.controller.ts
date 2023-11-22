import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard('jwt-access'))
  @Get('me')
  async getUserInfo(@Req() req: Request) {
    const user = req.user;
    return await this.userService.getUserInfo(user['sub']);
  }
}
