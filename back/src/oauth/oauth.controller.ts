import { Controller, Body, Post} from '@nestjs/common';
import { Param, Res } from '@nestjs/common/decorators';
import { OauthService } from './oauth.service';
import { PrismaCommands } from 'src/prisma/prisma.commands';
import { TokenService } from 'src/token/token.service';
import { Response } from 'express';

@Controller()
export class OauthController {
    constructor(
        private readonly authService: OauthService,
        private prismaCommands: PrismaCommands,
        private token: TokenService,
    ) {}

    @Post('oauth/intra/:code')
    async getToken(@Param('code') code: string, @Res() response: Response, @Body() body: any){
        var testeString = await this.authService.getAccessToken(code);
        const resultado = testeString;
        const user = await this.prismaCommands.createUserIntra(resultado, body.photo);
        await this.token.refreshToken(user.user, response);
        response.send();
    }


}
