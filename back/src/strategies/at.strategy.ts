import { ForbiddenException, Injectable, Req } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as argon from 'argon2'
import { PrismaService } from 'src/prisma/prisma.service';

type JwtPayload = {
	sub: string
}

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    private readonly config: ConfigService,
    private prisma: PrismaService,

    ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies['accessToken'],
      ]),
      secretOrKey: () => {
        return this.config.get('JWT_SECRET_REFRESH');
      },
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
