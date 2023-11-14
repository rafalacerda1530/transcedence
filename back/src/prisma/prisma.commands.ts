import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaService } from "./prisma.service";
import * as argon from 'argon2'

@Injectable()
export class PrismaCommands {
    constructor(private prisma: PrismaService) { }

    async createUserIntra(responseFromIntra: object) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email: responseFromIntra['email'],
                    hash: null
                },
            })
            if (user)
                return (user);
            const newUser = await this.prisma.user.create({
                data: {
                    email: responseFromIntra['email'],
                    user: responseFromIntra['login'],
                    userIntra: true
                },
            })
            return (newUser);
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException(
                        'Credentials already exists'
                    )
                }
            }
            throw (error)
        }
    }

    async updateJwtToken(userId: string, jwtToken: string): Promise<any> {
        const user = await this.prisma.user.update({
            where: { user: userId },
            data: {
                jwt_token: jwtToken,
            },
        });
    }
}
