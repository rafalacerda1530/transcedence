import { Body, Controller, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Get } from '@nestjs/common/decorators';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { Authentication2faService } from './authentication-2fa.service';

@Controller('authentication-2fa')
export class Authentication2faController {
    constructor(private readonly userService: UserService, private readonly service2fa: Authentication2faService,
        private readonly prisma: PrismaService) {}

    @Post('generate')
    @HttpCode(200)
    async generateQrCode(@Body() body, @Req() req){
        const user = await this.userService.getUserInfo(body.user)
        const secret = await this.service2fa.generateTwoFactorAuthenticationSecret(user['user'])
        this.service2fa.setTwoFactorAuthenticationSecret(secret['secret'], user['user'])
        const qrCode =  { qrCode: await this.service2fa.generateQrCodeDataURL(secret['otpAuthUrl']) }
        console.log(qrCode)
        return qrCode
    }

    @Post('2fa/authenticate')
    @HttpCode(200)
    async authenticate(@Req() request, @Body() body) {
        const isCodeValid = await this.service2fa.isTwoFactorAuthenticationCodeValid(
          body.twoFactorAuthenticationCode,
          body.user,
        );
        if (!isCodeValid) {
            return {success: "false"};
        }
        console.log(body.twoFactorAuthenticationCode)
        return {success: "true"};
    }

    @Post('2fa/checkAtive')
    @HttpCode(200)
    async isActive2faAuthenticate(@Req() request, @Body() body){
        try{
            const user = await this.prisma.user.findUnique({
		    	where: {
		    		user: body.user
		    	}
		    })
            if (user.authentication2fa == true){
                return {success: "true"}
            }
            return {success: "false"}
        } catch(error){
            return {success: "false"}
        }
    }

    @Post('2fa/activate')
    @HttpCode(200)
    async activate2faAuthenticate(@Req() request, @Body() body){
        console.log(body)
        try{
            await this.service2fa.setTwoFactorOn(body.user)
            return {success: "true"}
        } catch(error){
            return {success: "false"}
        }
    }

    @Post('2fa/desactivate')
    @HttpCode(200)
    async desactivate2faAuthenticate(@Req() request, @Body() body){
        console.log(body)
        try{
            await this.service2fa.setTwoFactorOf(body.user)
            return {success: "true"}
        } catch(error){
            return {success: "false"}
        }
    }
}
