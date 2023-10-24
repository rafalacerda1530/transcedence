import { Controller, Get } from '@nestjs/common';
import { Param } from '@nestjs/common/decorators';
import { OauthService } from './oauth.service';

@Controller()
export class OauthController {
  constructor(private readonly authService: OauthService) {}

  @Get('token/:code')
  async getToken(@Param('code') code: string) {
    return this.authService.getAccessToken(code);
  }
}
