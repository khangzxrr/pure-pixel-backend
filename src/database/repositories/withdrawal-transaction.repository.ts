import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class WithdrawalTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    amount: number,
    bankName: string,
    bankNumber: string,
    bankUsername: string,
  ) {
    return this.prisma.transaction.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        status: 'PENDING',
        amount,
        paymentPayload: {},
        type: 'WITHDRAWAL',
        paymentMethod: 'WALLET',
        withdrawalTransaction: {
          create: {
            bankName,
            bankUsername,
            bankNumber,
          },
        },
      },
    });
  }
}
