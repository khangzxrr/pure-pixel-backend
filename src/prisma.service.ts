import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  extendedClient() {
    const prisma = this.$extends({
      query: {
        camera: {
          async $allOperations({ operation, args, query }) {
            if (
              operation === 'findFirst' ||
              operation === 'findMany' ||
              operation === 'findUnique' ||
              operation === 'findFirstOrThrow' ||
              operation === 'findUniqueOrThrow' ||
              operation === 'count' ||
              operation === 'update' ||
              operation === 'updateMany'
            ) {
              args.where = { ...args.where, deletedAt: null };
            }

            if (operation === 'delete') {
              console.log(args);

              return prisma.camera.update({
                where: args.where,
                data: {
                  deletedAt: new Date(),
                },
              });
            }

            if (operation === 'deleteMany') {
              return prisma.camera.updateMany({
                where: args.where,
                data: {
                  deleteAt: new Date(),
                },
              });
            }

            return query(args);
          },
        },
        photoshootPackage: {
          async count({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
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
            return prisma.photoshootPackage.update({
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

        upgradePackage: {
          async count({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
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
            return prisma.upgradePackage.update({
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
          //
          //   async $allOperations({ operation, args, query }) {
          //     if (
          //       operation === 'findFirst' ||
          //       operation === 'findMany' ||
          //       operation === 'findUnique' ||
          //       operation === 'findFirstOrThrow' ||
          //       operation === 'findUniqueOrThrow' ||
          //       operation === 'count'
          //     ) {
          //       args.where = { ...args.where, deletedAt: null };
          //     }
          //
          //     return query(args);
          //   },
        },

        photo: {
          async count({ args, query }) {
            args.where = { ...args.where, deletedAt: null };

            return query(args);
          },
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
            return prisma.photo.update({
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

    return prisma;
  }
}
