import {
    Body,
    Controller,
    Get,
    HttpCode,
    Logger,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { Authentication2faService } from './authentication-2fa.service';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';

@Controller('authentication-2fa')
export class Authentication2faController {
    constructor(
        private readonly userService: UserService,
        private readonly service2fa: Authentication2faService,
        private readonly prisma: PrismaService,
    ) {}

    @UseGuards(AtGuard)
    @Post('generate')
    @HttpCode(200)
    async generateQrCode(@GetCurrentUser('sub') username: string) {
        const user = await this.userService.getUserInfo(username);
        const secret =
            await this.service2fa.generateTwoFactorAuthenticationSecret(
                user['user'],
            );
        this.service2fa.setTwoFactorAuthenticationSecret(
            secret['secret'],
            user['user'],
        );
        this.service2fa.setTwoFactorOn(
            user['user'],
        );
        const qrCode = {
            qrCode: await this.service2fa.generateQrCodeDataURL(
                secret['otpAuthUrl'],
            ),
        };
        console.log(qrCode);
        return qrCode;
    }


    @Post('2fa/authenticate')
    @HttpCode(200)
    async authenticate(@Body() body) {
        const isCodeValid =
            await this.service2fa.isTwoFactorAuthenticationCodeValid(
                body.twoFactorAuthenticationCode,
                body.user,
            );
        if (!isCodeValid) {
            return { success: 'false' };
        }
        return { success: 'true' };
    }

    @Post('2fa/checkAtive')
    @HttpCode(200)
    async isActive2faAuthenticate(@Body() body) {
        console.log(body.user,)
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    user: body.user,
                },
            });
            if (user.authentication2fa == true) {
                return { success: 'true' };
            }
            else{
                return { success: 'false' };
            }
        } catch (error) {
            return { success: 'false' };
        }
    }

    @UseGuards(AtGuard)
    @Post('2fa/checkIfAtive')
    @HttpCode(200)
    async isActive2faAuthentication(@GetCurrentUser('sub') username: string) {
        console.log(username,)
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    user: username,
                },
            });
            if (user.authentication2fa == true) {
                return { success: true };
            }
            else{
                return { success: false };
            }
        } catch (error) {
            return { success: false };
        }
    }

    @UseGuards(AtGuard)
    @Post('2fa/activate')
    @HttpCode(200)
    async activate2faAuthenticate(@GetCurrentUser('sub') username: string) {
        console.log(username);
        try {
            await this.service2fa.setTwoFactorOn(username);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }

    @UseGuards(AtGuard)
    @Post('2fa/desactivate')
    @HttpCode(200)
    async desactivate2faAuthenticate(@GetCurrentUser('sub') username: string) {
        try {
            await this.service2fa.setTwoFactorOf(username);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }
}
