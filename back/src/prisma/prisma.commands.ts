import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from './prisma.service';
import { User, UserStatus } from '@prisma/client';
import { Game } from 'src/game/game';
import { use } from 'passport';
import internal from 'stream';

@Injectable()
export class PrismaCommands {
    constructor(private prisma: PrismaService) { }

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
        const boolPlayer1Won = game.gameMode.score1 > game.gameMode.score2;

        const newGame = await this.prisma.game.create({
            data: {
                player1Name: player1.user,
                player2Name: player2.user,
                score1: game.gameMode.score1,
                score2: game.gameMode.score2,
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

    async updateUserStatus(username: string, status: UserStatus) {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });

        if (!user) {
            return ;
        }


        await this.prisma.user.update({
            where: { user: username },
            data: { status: status },
        });
    }

    async updateGameInvites(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });

        await this.prisma.message.updateMany({
            where: {
                senderId: user.id,
                gameInvite: true
            },
            data: {
                gameInvite: false
            }
        });
    }

    async getGameInviteInfo(username: string, groupName: string) {
        const user = await this.prisma.user.findUnique({
            where: { user: username },
        });
        const group = await this.prisma.group.findUnique({
            where: { name: groupName },
        })
        if (group) {
            const message = await this.prisma.message.findFirst({
                where: {
                    groupId: group.id,
                    gameInvite: true,
                    senderId: user.id
                }
            });
            return message;
        }

        const groupDM = await this.prisma.groupDM.findUnique({
            where: { name: groupName },
        })
        if (groupDM) {
            const message = await this.prisma.message.findFirst({
                where: {
                    groupDMId: groupDM.id,
                    gameInvite: true,
                    senderId: user.id
                }
            });
            return message;
        }
    }
}
