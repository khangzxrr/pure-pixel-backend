import { Injectable } from '@nestjs/common';
import { PrismaPromise } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DatabaseService {
  constructor(private readonly prismaService: PrismaService) {}

  async applyTransactionMultipleQueries<P extends PrismaPromise<unknown>[]>(
    queries: [...P],
  ) {
    return await this.prismaService.extendedClient().$transaction([...queries]);
  }
}
