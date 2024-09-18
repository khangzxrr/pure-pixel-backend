import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  extendedClient() {
    return this.$extends({
      query: {
        photo: {
          async findFirst({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
          async findMany({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
          async findUnique({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
          async findFirstOrThrow({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
          async findUniqueOrThrow({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
          async delete({ args }) {
            return this.photo.update({
              where: args.where,
              data: {
                deletedAt: new Date(),
              },
            });
          },
          async update({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
          async updateMany({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
        },
      },
    });
  }
}
