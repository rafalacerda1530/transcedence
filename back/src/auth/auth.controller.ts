import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Res, UploadedFile, UseInterceptors
} from '@nestjs/common';
import { AuthDto } from 'src/dto/auth.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import fetch from 'node-fetch'; // Importe o módulo 'node-fetch'

@Injectable()
export class ImageService {
	async convertImageToBase64(imagePathOrURL: string): Promise<string> {
		if (imagePathOrURL.startsWith('http')) {
		  // Se for uma URL, faz uma requisição para obter a imagem
		  const response = await fetch(imagePathOrURL);
		  const imageBuffer = await response.buffer();
		  return imageBuffer.toString('base64');
		} else {
		  // Se for um caminho local, lê o arquivo localmente
		  const image = fs.readFileSync(imagePathOrURL);
		  return Buffer.from(image).toString('base64');
		}
	  }
}
@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) { }

	@Post('signup')
	@HttpCode(HttpStatus.CREATED)
	async signup(@Body() dto: AuthDto, @Res() response: Response) {
		await this.authService.signup(dto, response);
		response.send();
	}

	@Post('signin')
	@HttpCode(HttpStatus.OK)
	async signin(@Body() dto: AuthDto, @Res() response: Response) {
		await this.authService.signin(dto, response);
		response.send();
	}
}
