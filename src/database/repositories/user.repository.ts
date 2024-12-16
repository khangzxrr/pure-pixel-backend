import { Injectable } from '@nestjs/common';
import { Prisma, PrismaPromise, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserEntity } from 'src/user/entities/user.entity';
import { DuplicatedUserIdException } from '../exceptions/duplicatedUserId.exception';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  rawCount(
    userId: string,
    ids: string[],
    search?: string,
    isFollowed?: boolean,
  ) {
    if (isFollowed) {
      return this.prisma.$queryRaw`SELECT COUNT(*)
                FROM public."User" INNER JOIN public."Follow"
                ON public."User"."id" = public."Follow"."followingId"
                WHERE public."User"."id" IN (${Prisma.join(ids)})
                AND "normalizedName" LIKE CONCAT('%', LOWER(${search}), '%')
                AND "followerId" = ${userId}`;
    }

    return this.prisma.$queryRaw`SELECT COUNT(*)
                FROM public."User"
                WHERE public."User"."id" IN (${Prisma.join(ids)})
                AND "normalizedName" LIKE CONCAT('%', LOWER(${search}), '%')`;
  }

  rawFindMany(
    userId: string,
    ids: string[],
    skip: number,
    take: number,
    search?: string,
    isFollowed?: boolean,
  ): PrismaPromise<User[]> {
    if (isFollowed) {
      return this.prisma.$queryRaw`SELECT *,
                ("followerId" IS NOT NULL) as "isFollowed",
                (SELECT COUNT(*) FROM public."Photo" WHERE "photographerId" = public."User"."id" AND "deletedAt" IS NULL AND "visibility" = 'PUBLIC') as "photoCount"
                FROM public."User" INNER JOIN public."Follow"
                ON public."User"."id" = public."Follow"."followingId"
                WHERE public."User"."id" IN (${Prisma.join(ids)})
                AND "normalizedName" LIKE CONCAT('%', LOWER(${search}), '%')
                AND "followerId" = ${userId}
                ORDER BY "followerId" DESC NULLS LAST, "photoCount" DESC 
                LIMIT ${take} OFFSET ${skip}
`;
    }

    return this.prisma.$queryRaw`SELECT *,
                (SELECT COUNT(*) > 0 FROM public."Follow" WHERE "followerId" = ${userId} AND "followingId" = "id") as "isFollowed",
                (SELECT COUNT(*) FROM public."Photo" WHERE "photographerId" = public."User"."id" AND "deletedAt" IS NULL AND "visibility" = 'PUBLIC') as "photoCount"
                FROM public."User"
                WHERE public."User"."id" IN (${Prisma.join(ids)})
                AND "normalizedName" LIKE CONCAT('%', LOWER(${search}), '%') 
                ORDER BY "isFollowed" DESC, "photoCount" DESC
                LIMIT ${take} OFFSET ${skip}
`;
  }

  count(where: Prisma.UserWhereInput) {
    return this.prisma.extendedClient().user.count({
      where,
    });
  }

  updateMaxQuotaByUserIdTransaction(
    id: string,
    maxPhotoQuota: bigint,
    maxPackageCount: bigint,
    tx: Prisma.TransactionClient,
  ) {
    return tx.user.update({
      where: {
        id,
      },
      data: {
        maxPhotoQuota,
        maxPackageCount,
      },
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

  aggregate(aggregate: Prisma.UserAggregateArgs) {
    return this.prisma.user.aggregate(aggregate);
  }

  update(
    userId: string,
    user: Prisma.UserUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    if (tx) {
      return tx.user.update({
        where: {
          id: userId,
        },
        data: user,
      });
    }

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
    include: Prisma.UserInclude,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.extendedClient().user.findMany({
      where,
      include,
      orderBy,
      skip,
      take,
    });
  }
}
