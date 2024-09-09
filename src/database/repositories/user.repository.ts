import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { DuplicatedUserIdException } from '../exceptions/duplicatedUserId.exception';

@Injectable()
export class UserRepository {
  private logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}
  async getById(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
      },
    });
  }

  async createIfNotExistTransaction(user: User, tx: Prisma.TransactionClient) {
    try {
      return tx.user.upsert({
        where: {
          id: user.id,
        },
        update: {
          ftpUsername: user.ftpUsername,
          ftpPassword: user.ftpPassword,
          ftpEndpoint: user.ftpEndpoint,
        },
        create: user,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new DuplicatedUserIdException();
        }
      }
    }
  }

  async createIfNotExist(user: User) {
    try {
      return this.prisma.user.upsert({
        where: {
          id: user.id,
        },
        update: {},
        create: user,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new DuplicatedUserIdException();
        }
      }
    }
  }
}
