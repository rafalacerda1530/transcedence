import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
			profileImage: user.profileImage

		};
		return userSend;
	}

	async getUserHistoryInfo(username: string) {
		const userId = await this.prisma.user.findUnique({
			where: {
				user: username,
			},
		});
		const userHistory = await this.prisma.userGameHistory.findMany({
			where: {
				userId: userId.id,
			},
		});
		const winCount = userHistory.filter(entry => entry.outcome === true).length;
		const loseCount = userHistory.filter(entry => entry.outcome === false).length;
		const score = winCount - loseCount; // Pontuação: 1 ponto por vitória, -1 ponto por derrota

		const userSend = {
			win: winCount,
			lose: loseCount,
			score : score
		};


		return userSend;
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

}
