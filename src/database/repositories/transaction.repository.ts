import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: string,
    includeUserToUserTransactionId: boolean = false,
    includeDepositTransactionId: boolean = false,
    includeServiceTransactionId: boolean = false,
    includeWithdrawalTransactionId: boolean = false,
  ) {
    return this.prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        userToUserTransaction: {
          select: {
            id: includeUserToUserTransactionId,
          },
        },
        depositTransaction: {
          select: {
            id: includeDepositTransactionId,
          },
        },
        serviceTransaction: {
          select: {
            id: includeServiceTransactionId,
          },
        },
        withdrawalTransaction: {
          select: {
            id: includeWithdrawalTransactionId,
          },
        },
      },
    });
  }
}
