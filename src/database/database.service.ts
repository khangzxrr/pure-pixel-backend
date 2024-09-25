import { Injectable } from '@nestjs/common';
import { PrismaPromise } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DatabaseService {
  constructor(private readonly prismaService: PrismaService) {}

  async applyTransactionMultipleQueries(queries: PrismaPromise<any>[]) {
    return await this.prismaService.extendedClient().$transaction([...queries]);
  }
}
