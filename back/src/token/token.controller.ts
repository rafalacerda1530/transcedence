import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { Response } from 'express';
import { RtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';

@Controller('/token')
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @UseGuards(RtGuard)
  @Get('/refresh')
  async refreshToken(@GetCurrentUser('sub') user: string, @Res() response: Response) {
    await this.tokenService.refreshToken(user, response);
    response.send();
  }
}
