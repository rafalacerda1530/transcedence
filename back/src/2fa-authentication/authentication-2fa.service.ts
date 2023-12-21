import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class Authentication2faService {
    constructor(private prisma: PrismaService) {}

    async generateTwoFactorAuthenticationSecret(user: string) {
        const secret = authenticator.generateSecret();

        const otpAuthUrl = authenticator.keyuri(
            user,
            'PONG_GAME_TRANSCEDENCE',
            secret,
        );

        await this.setTwoFactorAuthenticationSecret(secret, user);

        return {
            secret,
            otpAuthUrl,
        };
    }
    async setTwoFactorAuthenticationSecret(secret: string, userName: string) {
        await this.prisma.user.update({
            where: { user: userName },
            data: { authentication2faSecret: secret },
        });
    }

    async generateQrCodeDataURL(otpAuthUrl: string) {
        return toDataURL(otpAuthUrl);
    }

    async isTwoFactorAuthenticationCodeValid(
        twoFactorAuthenticationCode: string,
        userName: string,
    ) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    user: userName,
                },
            });
            const secret = user.authentication2faSecret;
            return authenticator.verify({
                token: twoFactorAuthenticationCode,
                secret: secret,
            });
        } catch (error) {
            return false;
        }
    }

    async setTwoFactorOn(userName: string) {
        await this.prisma.user.update({
            where: { user: userName },
            data: { authentication2fa: true },
        });
    }

    async setTwoFactorOf(userName: string) {
        await this.prisma.user.update({
            where: { user: userName },
            data: { authentication2fa: false },
        });
    }
}
