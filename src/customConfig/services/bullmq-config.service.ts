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
    console.log(`redis host name ${process.env.REDIS_HOSTNAME}`);
    return {
      connection: {
        host: process.env.REDIS_HOSTNAME,
        port: Number(process.env.REDIS_PORT),
      },
    };
  }
}
