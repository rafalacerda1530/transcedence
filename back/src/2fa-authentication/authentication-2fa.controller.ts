import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { Authentication2faService } from './authentication-2fa.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('authentication-2fa')
export class Authentication2faController {
  constructor(
    private readonly userService: UserService,
    private readonly service2fa: Authentication2faService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard('jwt-access'))
  @Post('generate')
  @HttpCode(200)
  async generateQrCode(@Req() req: Request) {
    const user = await this.userService.getUserInfo(req.user['sub']);
    const secret = await this.service2fa.generateTwoFactorAuthenticationSecret(
      user['user'],
    );
    this.service2fa.setTwoFactorAuthenticationSecret(
      secret['secret'],
      user['user'],
    );
    const qrCode = {
      qrCode: await this.service2fa.generateQrCodeDataURL(secret['otpAuthUrl']),
    };
    console.log(qrCode);
    return qrCode;
  }

  @Post('2fa/authenticate')
  @HttpCode(200)
  async authenticate(@Req() request, @Body() body) {
    const isCodeValid =
      await this.service2fa.isTwoFactorAuthenticationCodeValid(
        body.twoFactorAuthenticationCode,
        body.user,
      );
    if (!isCodeValid) {
      return { success: 'false' };
    }
    console.log(body.twoFactorAuthenticationCode);
    return { success: 'true' };
  }

  @Post('2fa/checkAtive')
  @HttpCode(200)
  async isActive2faAuthenticate(@Req() request, @Body() body) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          user: body.user,
        },
      });
      if (user.authentication2fa == true) {
        return { success: 'true' };
      }
      return { success: 'false' };
    } catch (error) {
      return { success: 'false' };
    }
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Post('2fa/activate')
  @HttpCode(200)
  async activate2faAuthenticate(@Req() req: Request) {
    console.log(req.user['sub']);
    try {
      await this.service2fa.setTwoFactorOn(req.user['sub']);
      return { success: 'true' };
    } catch (error) {
      return { success: 'false' };
    }
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Post('2fa/desactivate')
  @HttpCode(200)
  async desactivate2faAuthenticate(@Req() req: Request) {
    console.log(req.user['sub']);
    try {
      await this.service2fa.setTwoFactorOf(req.user['sub']);
      return { success: 'true' };
    } catch (error) {
      return { success: 'false' };
    }
  }
}
