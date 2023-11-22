import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('/token')
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('/refresh')
  async refreshToken(@Req() req: Request, @Res() response: Response) {
    const user = req.user;
    await this.tokenService.refreshToken(user['sub'], response);
    response.send();
  }
}
