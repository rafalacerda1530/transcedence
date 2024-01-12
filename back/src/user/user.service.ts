import { Injectable } from '@nestjs/common';
import { Console } from 'console';
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
			user: user.user,
			email: user.email,
			profileImage: user.profileImage

		};
		console.log("TESTE 2 --> ",userSend)
		return userSend;
	}

	async saveProfileImage(username: string, filePath: string) {
		// Atualizar o caminho do arquivo no banco de dados para o usuário específico
		console.log("TESTE 1 --> ",username, filePath)
		const updatedUser = await this.prisma.user.update({
			where: { user: username },
			data: { profileImage: filePath },
		});

		return updatedUser;
	}

}
