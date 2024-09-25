import {
  RegisterQueueOptions,
  RegisterQueueOptionsFactory,
} from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BullMqQueueRegisterService implements RegisterQueueOptionsFactory {
  createRegisterQueueOptions():
    | Promise<RegisterQueueOptions>
    | RegisterQueueOptions {
    return {
      connection: {
        host: process.env.REDIS_HOSTNAME,
        port: Number(process.env.REDIS_PORT),
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    };
  }
}
