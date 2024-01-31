import { Injectable, Logger, Res } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) { }

	async getUserInfo(username: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				user: username,
			},
		});
		const userSend = {
			userId: user.id,
			user: user.user,
			nickname: user.nickname,
			email: user.email,
			profileImage: user.profileImage,
			status: user.status,
		};
		return userSend;
	}

	async getUserHistoryInfo(username: string) {
		const userId = await this.prisma.user.findUnique({
			where: {
				user: username,
			},
		});
		const userGames = await this.prisma.game.findMany({
			where: {
				OR: [
					{ player1Id: userId.id },
					{ player2Id: userId.id },
				],
			},
		});
		const winCount = userGames.filter(game =>
			(game.player1Id === userId.id && game.player1Won) ||
			(game.player2Id === userId.id && game.player2Won)
		).length;

		const loseCount = userGames.filter(game =>
			(game.player1Id === userId.id && !game.player1Won) ||
			(game.player2Id === userId.id && !game.player2Won)
		).length;
		const score = winCount - loseCount; // Pontuação: 1 ponto por vitória, -1 ponto por derrota

		const userSend = {
			win: winCount,
			lose: loseCount,
			score: score
		};


		return userSend;
	}

	async userLogout(username: string, @Res() res: Response){
        const user = await this.prisma.user.update({
            where: {
                user: username,
            },
            data: {
                jwt_token: '',
            },
        });
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
    }

	async saveProfileImage(username: string, filePath: string) {
		// Atualizar o caminho do arquivo no banco de dados para o usuário específico
		const updatedUser = await this.prisma.user.update({
			where: { user: username },
			data: { profileImage: filePath },
		});

		return updatedUser;
	}

	async updateUserProfile(
		userId: number,
		newUser: string,
		newNickname: string,
		newEmail: string,
	) {
		// lógica para obter a nova imagem
		// Atualizar o nome e o e-mail no banco de dados
		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: {
				user: newUser,
				email: newEmail,
				nickname: newNickname
			},
		});

		return updatedUser;
	}

	async getUserHistoryComplete(username: string) {

		const user = await this.prisma.user.findUnique({
			where: {
				user: username,
			},
		});

		if (!user) {
			// Handle the case where the user is not found
			Logger.warn(`User with username '${username}' not found.`);
			return null; // Or handle it according to your needs
		}

		const userGames = await this.prisma.game.findMany({
			where: {
			  OR: [
				{ player1Id: user.id },
				{ player2Id: user.id },
			  ],
			},
		  });

		const history = await userGames.filter(game =>
			(game.player1Id === user.id ) ||
			(game.player2Id === user.id )
		);
		//console.log(history)
		let historyLenght = history.length;
		if (historyLenght > 5){
			historyLenght = 5;
		}
		console.log("lenght: ", historyLenght)
		const historyComplete = {}
		for (let i = 0; i < historyLenght; i++){
			historyComplete[i] = {'Partida': history[i].player1Name + ' VS ' + history[i].player2Name,
				 'Pontos_Player1': 'Pontuação ' + history[i].player1Name + ': ' + history[i].score1 ,
				 'Pontos_Player2': 'Pontuação ' + history[i].player2Name + ': ' + history[i].score2 ,
				 'Tamanho_Array' : historyLenght
			}
			if (history[i].player1Won === true){
				historyComplete[i]['Vencedor'] = 'Vencedor: ' + history[i].player1Name
			}
			else{
				historyComplete[i]['Vencedor'] = 'Vencedor: ' + history[i].player2Name
			};
			console.log("i : ", i)
			console.log(historyComplete[i])
	}
		const userSend = {

			history: historyComplete
		};

		return userSend;
	}

}
