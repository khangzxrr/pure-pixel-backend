import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countAll(where: Prisma.TransactionWhereInput) {
    return this.prisma.transaction.count({
      where,
    });
  }

  cancelAllPendingTransactionByIdAndType(type: TransactionType) {
    return this.prisma.transaction.updateMany({
      where: {
        type,
        status: 'PENDING',
      },
      data: {
        status: 'CANCEL',
      },
    });
  }

  async updateStatusAndPayload(
    id: string,
    status: TransactionStatus,
    payload: object,
  ) {
    return this.prisma.transaction.update({
      where: {
        id,
      },
      data: {
        status,
        paymentPayload: payload,
      },
    });
  }

  async findAll(
    where: Prisma.TransactionWhereInput,
    skip?: number,
    take?: number,
    orderBy?: Prisma.TransactionOrderByWithRelationInput[],
  ) {
    return this.prisma.transaction.findMany({
      where,
      skip,
      take,
      include: {
        toUserTransaction: true,
        fromUserTransaction: true,
        depositTransaction: true,
        serviceTransaction: true,
        withdrawalTransaction: true,
      },
      orderBy,
    });
  }

  async findUniqueOrThrow(where: Prisma.TransactionWhereUniqueInput) {
    return this.prisma.transaction.findUniqueOrThrow({
      where,
      include: {
        toUserTransaction: {
          select: {
            id: true,
          },
        },
        fromUserTransaction: {
          select: {
            id: true,
          },
        },
        depositTransaction: {
          select: {
            id: true,
          },
        },
        serviceTransaction: {
          select: {
            id: true,
          },
        },
        withdrawalTransaction: {
          select: {
            id: true,
          },
        },
      },
    });
  }
}
