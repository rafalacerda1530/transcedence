import { ForbiddenException, Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

type JwtPayload = {
    sub: string;
};

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    refreshToken: any;
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
					if (!req.cookies || !req.cookies['refreshToken']) {
						throw new UnauthorizedException();
					}
                    this.refreshToken = req.cookies['refreshToken'];
                    return req.cookies['refreshToken'];
                },
            ]),
            secretOrKey: config.get('JWT_SECRET_REFRESH'),
        });
    }

    async validate(payload: JwtPayload, @Req() req: Request) {
        const user = await this.prisma.user.findUnique({
            where: {
                user: payload.sub,
            },
        });
        const tokenMatches = await argon.verify(
            user.jwt_token,
            this.refreshToken,
        );
        if (!tokenMatches) throw new ForbiddenException('Incorrect token');
        return payload;
    }
}
