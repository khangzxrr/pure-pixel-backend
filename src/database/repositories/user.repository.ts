import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserEntity } from 'src/user/entities/user.entity';
import { DuplicatedUserIdException } from '../exceptions/duplicatedUserId.exception';
import { UserFilterDto } from 'src/user/dto/user-filter.dto';

@Injectable()
export class UserRepository {
  private logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOne(userFilterDto: UserFilterDto) {
    console.log(userFilterDto);
    return this.prisma.user.findUnique({
      where: {
        id: userFilterDto.id,
      },
      include: {
        transactions: userFilterDto.transactions,
        upgradeOrders: userFilterDto.upgradeOrders,
      },
    });
  }

  async findOneTransaction(
    userFilterDto: UserFilterDto,
    tx: Prisma.TransactionClient,
  ) {
    return tx.user.findUnique({
      where: {
        id: userFilterDto.id,
      },
      include: {
        transactions: userFilterDto.transactions,
        upgradeOrders: userFilterDto.upgradeOrders,
      },
    });
  }

  async createIfNotExistTransaction(
    user: UserEntity,
    tx: Prisma.TransactionClient,
  ) {
    try {
      return tx.user.upsert({
        where: {
          id: user.id,
        },
        update: {
          ftpUsername: user.ftpUsername,
          ftpPassword: user.ftpPassword,
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

  async createIfNotExist(user: UserEntity) {
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
