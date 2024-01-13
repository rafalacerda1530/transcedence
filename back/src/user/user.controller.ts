import { Controller, Get, Req, UseGuards, Post, UseInterceptors, UploadedFile, Query, Body, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {  EditDto } from 'src/dto/auth.dto';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) { }

	@UseGuards(AtGuard)
	@Get('me')
	async getUserInfo(@GetCurrentUser('sub') user: string) {
		return await this.userService.getUserInfo(user);
	}

	@Post('uploadImage')
	@UseInterceptors(
		FileInterceptor('profileImage', {
			storage: diskStorage({
				destination: './uploads', // Diretório onde as imagens serão salvas temporariamente
				filename: (req, file, cb) => {
					const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
					const extension = file.mimetype.split('/')[1]; // Obter a extensão do arquivo
					const filename = `${uuidv4()}-${uniqueSuffix}.${extension}`;
					cb(null, filename);
				},
			}),
		}),
	)
	async uploadImage(
		@UploadedFile() file,
		@Body('user') user: string
	) {
		try {
			const filePath = file.path;
			const updatedUser = await this.userService.saveProfileImage(user, filePath);
			console.log("Imagem salva com sucesso para o usuário:", user);

			return { message: 'Imagem salva com sucesso!', user: updatedUser };
		} catch (error) {
			console.error('Erro ao salvar a imagem:', error);
			// Tratar o erro adequadamente
		}
	}

	@Patch('updateProfile')
	async updateProfile(@Body() dto: EditDto,
	) {

		try {
			const updatedUserData = await this.userService.updateUserProfile(
				dto.userId,
				dto.user,
				dto.nickname,
				dto.email,
			);

			return { message: 'Perfil atualizado com sucesso!', user: updatedUserData };
		} catch (error) {
			console.error('Erro ao atualizar o perfil:', error);
		}
	}

}