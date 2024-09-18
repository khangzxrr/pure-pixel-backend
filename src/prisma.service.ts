import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
  extendedClient = this.$extends(
    createSoftDeleteExtension({
      models: {
        Photo: {
          field: 'deletedAt',
          createValue: (deleted) => {
            console.log('trigger deleted');
            console.log(deleted);
            if (deleted) return new Date();

            return null;
          },
        },
      },
    }),
  );

  getExtendedClient() {
    return this.$extends(
      createSoftDeleteExtension({
        models: {
          Photo: {
            field: 'deletedAt',
            createValue: (deleted) => {
              console.log('trigger deleted');
              console.log(deleted);
              if (deleted) return new Date();

              return null;
            },
          },
        },
      }),
    );
  }
}
