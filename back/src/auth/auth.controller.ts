import { Body, Controller, HttpCode, HttpStatus, Post, Res } from "@nestjs/common";
import { AuthDto } from "src/dto/auth.dto";
import { AuthService } from "./auth.service";
import { Response } from "express";

@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService) {}

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async signup(@Body() dto: AuthDto, @Res() response: Response){
        await this.authService.signup(dto, response);
        response.send();
    }

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    async signin(@Body()dto: AuthDto, @Res() response: Response){
        await this.authService.signin(dto, response);
        response.send();
    }

}
