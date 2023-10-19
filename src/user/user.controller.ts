import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private user: UserService){}

    @Post('signup')
    signup(@Body() body: any){
        return this.user.createAccount(body)
    }

    @Post('login')
    login(@Body() body: any){
        return this.user.login(body)
    }
}
