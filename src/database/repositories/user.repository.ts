import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async getById(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
      },
    });
  }

  async create(user: User) {
    return this.prisma.user.create({
      data: user,
    });
  }
}
