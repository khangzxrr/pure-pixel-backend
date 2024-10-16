import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserEntity } from 'src/user/entities/user.entity';
import { DuplicatedUserIdException } from '../exceptions/duplicatedUserId.exception';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';

@Injectable()
export class UserRepository {
  private logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  updateMaxQuotaByUserId(
    id: string,
    maxPhotoQuota: bigint,
    maxPackageCount: bigint,
  ) {
    return this.prisma.extendedClient().user.update({
      where: {
        id,
      },
      data: {
        maxPhotoQuota,
        maxPackageCount,
      },
    });
  }

  increasePhotoQuotaUsageById(id: string, increment: number) {
    return this.prisma.extendedClient().user.update({
      where: {
        id,
      },
      data: {
        photoQuotaUsage: {
          increment,
        },
      },
    });
  }

  async findUserQuotaById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        maxPhotoQuota: true,
        maxPackageCount: true,

        photoQuotaUsage: true,
        packageCount: true,
      },
    });
  }

  async findOneByIdWithFollowings(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      include: {
        followings: {
          select: {
            followingId: true,
          },
        },
      },
    });
  }

  async findUniqueOrThrow(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }
  async findUnique(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async findOneWithCount(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            followers: true,
            followings: true,
            photos: true,
          },
        },
      },
    });
  }

  updateUser(userId: string, user: Prisma.UserUpdateInput) {
    return this.prisma.extendedClient().user.update({
      where: {
        id: userId,
      },
      data: user,
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
        followers: userFilterDto.followers,
        followings: userFilterDto.followings,
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
