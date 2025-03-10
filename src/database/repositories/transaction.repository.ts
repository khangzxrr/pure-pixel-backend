import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TransactionCreateInput) {
    return this.prisma.extendedClient().transaction.create({
      data,
    });
  }

  async countAll(where: Prisma.TransactionWhereInput) {
    return this.prisma.transaction.count({
      where,
    });
  }

  cancelAllPendingTransactionByIdAndType(
    userId: string,
    type: TransactionType,
  ) {
    return this.prisma.transaction.updateMany({
      where: {
        userId,
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

  async update(
    where: Prisma.TransactionWhereInput,
    update: Prisma.TransactionUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    if (tx) {
      return tx.transaction.updateMany({
        where,
        data: update,
      });
    }

    return this.prisma.transaction.updateMany({
      where,
      data: update,
    });
  }

  async aggregate(args: Prisma.TransactionAggregateArgs) {
    return this.prisma.extendedClient().transaction.aggregate(args);
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
        user: true,
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
        user: true,
        toUserTransaction: true,
        fromUserTransaction: true,
        depositTransaction: true,
        serviceTransaction: true,
        withdrawalTransaction: true,
      },
    });
  }
}
