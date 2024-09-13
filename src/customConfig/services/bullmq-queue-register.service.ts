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
    console.log(`register queue with hostname ${process.env.REDIS_HOSTNAME}`);

    return {
      connection: {
        host: process.env.REDIS_HOSTNAME,
        port: Number(process.env.REDIS_PORT),
      },
    };
  }
}
