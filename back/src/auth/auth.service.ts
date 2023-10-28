import { Body, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthDto } from "src/dto/auth.dto";
import * as argon from 'argon2'
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import axios from 'axios';

@Injectable({})
export class AuthService{
    constructor(private prisma: PrismaService){}

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
    
    }

   
}

