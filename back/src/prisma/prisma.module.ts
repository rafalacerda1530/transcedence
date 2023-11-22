import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators';
import { PrismaCommands } from './prisma.commands';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, PrismaCommands],
  exports: [PrismaService, PrismaCommands],
})
export class PrismaModule {}
