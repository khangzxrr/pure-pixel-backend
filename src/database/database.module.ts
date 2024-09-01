import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserRepository } from './repositories/user.repository';
import { PhotoRepository } from './repositories/photo.repository';
@Module({
  providers: [PrismaService, UserRepository, PhotoRepository],
  exports: [PrismaService, UserRepository, PhotoRepository],
})
export class DatabaseModule {}
