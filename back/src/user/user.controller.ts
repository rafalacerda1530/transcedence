import { Controller, Get, Req, UseGuards, Post, UseInterceptors, UploadedFile, Query, Body, Patch, Param, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { EditDto } from 'src/dto/auth.dto';
import { Logger } from '@nestjs/common/services';
import { Response } from 'express';


@Controller('user')
export class UserController {
	constructor(private userService: UserService) { }

	@UseGuards(AtGuard)
	@Get('me')
	async getUserInfo(@GetCurrentUser('sub') user: string) {
		return await this.userService.getUserInfo(user);
	}

	@UseGuards(AtGuard)
	@Get('meHistory')
	async getUserHistoryInfo(@GetCurrentUser('sub') user: string) {
		return await this.userService.getUserHistoryInfo(user);
	}

	@UseGuards(AtGuard)
    @Post('logout')
    async userLogout(@GetCurrentUser('sub') user: string, @Res() res: Response) {
		await this.userService.userLogout(user, res);
		res.send({message: "User logged out successfully"});
    }

	@Post('uploadImage')
	@UseInterceptors(
		FileInterceptor('profileImage', {
			storage: diskStorage({
				destination: './../front/public/profilesUser', // Diretório onde as imagens serão salvas temporariamente
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
		console.log("I M A G E",file.filename, user)
		try {
			const fileName = file.filename;
			const updatedUser = await this.userService.saveProfileImage(user, fileName);
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

	

	@UseGuards(AtGuard)
	@Get('meInfo')
	async getUserInformation(@Query('user') user: string) {
		return await this.userService.getUserInfo(user);
	}

	@UseGuards(AtGuard)
	@Get('matchHistory')
	async getUserHistoryMatch(@Query('user') user: string) {
		return await this.userService.getUserHistoryInfo(user);
	}

	@Get('getUserHistoryComplete')
	async getUserHistoryComplete(@Query('user') user: string) {
    try {
        //Logger.log("Fetching user history information...");
        const userHistoryInfo = await this.userService.getUserHistoryComplete(user);
        console.log("User History Information: ", userHistoryInfo.history[0]);
		return(userHistoryInfo)
    } catch (error) {
        Logger.error("Error fetching user history information", error);
        return("Usuário não localizado")
    }}
}
