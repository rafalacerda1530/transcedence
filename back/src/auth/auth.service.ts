import { Body, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthDto } from "src/dto/auth.dto";
import * as argon from 'argon2'
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import axios from 'axios';
import { JwtService } from "@nestjs/jwt/dist";
import { ConfigService } from "@nestjs/config";
import { PrismaCommands } from "src/prisma/prisma.commands";

@Injectable({})
export class AuthService{
    constructor(
        private prisma: PrismaService, 
        private jwt: JwtService,
        private config: ConfigService,
        private prismaCommands: PrismaCommands, 
    ){}

    async signup(dto: AuthDto){
        const hash = await argon.hash(dto.password);
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                    user: dto.user
                },
            })

            delete user.hash
            return user
            
        } catch (error) {
             if (error instanceof PrismaClientKnownRequestError){
                if (error.code === 'P2002') {
                    throw new ForbiddenException(
                        'Credentials already exists'
                    )
                }
            }
            throw(error)
        }
    }

    async signin(dto: AuthDto){
        console.log(dto)
        const user = await this.prisma.user.findUnique({
            where: {
                user: dto.user
            }
        })
        console.log(user)
        if (!user) throw new ForbiddenException(
            'User Incorect'
        )
        const pwMatches = await argon.verify(user.hash, dto.password)
        if (!pwMatches) throw new ForbiddenException(
            'Password Incorrect'
        )
        const user_token = await this.signToken(user.user)
        console.log("token_bd: ",user_token)
        this.prismaCommands.updateJwtToken(dto.user, user_token['acces_token'])
        return this.signToken(user.user)
    }

    async signToken(user: string): Promise<{acces_token: string}>{
        const payload = {
            sub: user
        }
        const secret = this.config.get('JWT_SECRET')
        
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '1h',
            secret: secret,
        });
        return {acces_token: token};
    }

}
