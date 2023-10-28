import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthDto } from "src/dto/auth.dto";

import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService) {}

    @Post('signup')
    signup(@Body() dto: AuthDto){
        return this.authService.signup(dto)
    }

    @Get('signin')
    signin(@Body()dto: AuthDto){
        return this.authService.signin(dto)
    }
    
}