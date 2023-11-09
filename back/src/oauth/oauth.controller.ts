import { Controller, Get } from '@nestjs/common';
import { Param } from '@nestjs/common/decorators';
import { OauthService } from './oauth.service';
import { PrismaCommands } from 'src/prisma/prisma.commands';
@Controller()
export class OauthController {
  constructor(private readonly authService: OauthService, private prismaCommands: PrismaCommands) {}

  @Get('token/:code')
  async getToken(@Param('code') code: string) {
      var  testeString  =  this.authService.getAccessToken(code);
      const resultado = await testeString;
      return (this.prismaCommands.createUserIntra(await resultado))
  }

}
