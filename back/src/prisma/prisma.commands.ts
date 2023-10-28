import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaCommands{
    constructor(private prisma: PrismaService){}

    async createUserIntra(responseFromIntra: object){
        console.log(typeof responseFromIntra)
        try{
            const user = await this.prisma.user.create({
                data: {
                    email: responseFromIntra['email'],
                    user: responseFromIntra['login'],
                    userIntra: true
            },
        }
    )}catch (error) {
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

}
