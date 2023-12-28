import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

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
    return userSend;
  }
}
