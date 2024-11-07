import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserEntity } from 'src/user/entities/user.entity';
import { DuplicatedUserIdException } from '../exceptions/duplicatedUserId.exception';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';

@Injectable()
export class UserRepository {
  private logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.UserWhereInput) {
    return this.prisma.extendedClient().user.count({
      where,
    });
  }

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

  async findUniqueOrThrow(id: string, include?: Prisma.UserInclude) {
    return this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }
  async findUnique(userId: string, include?: Prisma.UserInclude) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include,
    });
  }

  update(userId: string, user: Prisma.UserUpdateInput) {
    return this.prisma.extendedClient().user.update({
      where: {
        id: userId,
      },
      data: user,
    });
  }

  async findUniqueTransaction(
    userFilterDto: UserFilterDto,
    tx: Prisma.TransactionClient,
  ) {
    return tx.user.findUnique({
      where: {
        id: userFilterDto.id,
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

  async upsert(user: Prisma.UserCreateInput) {
    return this.prisma.user.upsert({
      where: {
        id: user.id,
      },
      update: {},
      create: user,
    });
  }

  async findManyWithoutPaging(where: Prisma.UserWhereInput) {
    return this.prisma.extendedClient().user.findMany({
      where,
    });
  }

  async findMany(
    where: Prisma.UserWhereInput,
    orderBy: Prisma.UserOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return this.prisma.extendedClient().user.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }
}
