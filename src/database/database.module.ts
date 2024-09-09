import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserRepository } from './repositories/user.repository';
import { PhotoRepository } from './repositories/photo.repository';
import { CategoryRepository } from './repositories/category.repository';
@Module({
  providers: [
    PrismaService,
    UserRepository,
    PhotoRepository,
    CategoryRepository,
  ],
  exports: [PrismaService, UserRepository, PhotoRepository, CategoryRepository],
})
export class DatabaseModule {}
