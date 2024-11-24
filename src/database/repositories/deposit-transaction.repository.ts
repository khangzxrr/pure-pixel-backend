import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DepositTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, amount: number, paymentMethod: PaymentMethod) {
    return this.prisma.transaction.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        paymentMethod,
        paymentPayload: {},
        depositTransaction: {
          create: {},
        },
      },
    });
  }
}
