import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from './prisma.service';
import { User } from '@prisma/client';
import { Game } from 'src/game/game';

@Injectable()
export class PrismaCommands {
    constructor(private prisma: PrismaService) {}

    async createUserIntra(responseFromIntra: object) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email: responseFromIntra['email'],
                    hash: null,
                },
            });
            if (user) return user;
            const newUser = await this.prisma.user.create({
                data: {
                    email: responseFromIntra['email'],
                    user: responseFromIntra['login'],
                    userIntra: true,
                },
            });
            return newUser;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Credentials already exists');
                }
            }
            throw error;
        }
    }

    async updateJwtToken(userId: string, jwtToken: string): Promise<any> {
        await this.prisma.user.update({
            where: { user: userId },
            data: {
                jwt_token: jwtToken,
            },
        });
    }

    async addGame(player1: User, player2: User, game: Game): Promise<any> {
        const boolPlayer1Won = game.score1 > game.score2;

        const newGame = await this.prisma.game.create({
            data: {
                player1Name: player1.user,
                player2Name: player2.user,
                score1: game.score1,
                score2: game.score2,
                player1: {
                    connect: { id: player1.id },
                },
                player2: {
                    connect: { id: player2.id },
                },
                player1Won: boolPlayer1Won,
                player2Won: !boolPlayer1Won,
            },
        });
        return newGame;
    }
}
