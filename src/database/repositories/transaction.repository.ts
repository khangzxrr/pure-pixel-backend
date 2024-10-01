import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countAllByUserId(userId: string) {
    return this.prisma.transaction.count({
      where: {
        userId,
      },
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

  async findAllByUserId(
    userId: string,
    orderBy?: Prisma.TransactionOrderByWithRelationInput[],
  ) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
      },
      include: {
        userToUserTransaction: true,
        depositTransaction: true,
        serviceTransaction: true,
        withdrawalTransaction: true,
      },
      orderBy,
    });
  }

  async findById(id: string) {
    return this.prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        userToUserTransaction: {
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
