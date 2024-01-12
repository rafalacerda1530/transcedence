import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type JwtPayload = {
    sub: string;
};

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    if (!req.cookies || !req.cookies['accessToken']) {
                        throw new UnauthorizedException();
                    }
                    return req.cookies['accessToken'];
                },
            ]),
            secretOrKey: config.get('JWT_SECRET_ACCESS'),
        });
    }

    async validate(payload: JwtPayload) {
        return payload;
    }
}
