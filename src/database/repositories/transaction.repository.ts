import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
      },
      include: {},
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
