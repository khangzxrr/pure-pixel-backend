import {
  BullRootModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BullMqConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration():
    | Promise<BullRootModuleOptions>
    | BullRootModuleOptions {
    return {
      connection: {
        host: process.env.REDIS_HOSTNAME,
        port: Number(process.env.REDIS_PORT),
      },
    };
  }
}
