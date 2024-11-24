import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { SftpService } from './services/sftp.service';
import { AxiosRetryModule } from 'nestjs-axios-retry';
import axiosRetry from 'axios-retry';
import { BunnyService } from './services/bunny.service';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { TineyeService } from './services/tineye.service';

@Module({
  imports: [
    AxiosRetryModule.forRoot({
      axiosRetryConfig: {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        shouldResetTimeout: true,
        onRetry: (retryCount, error) => {
          console.log(error);
          console.log(`Retrying request attempt ${retryCount}`);
        },
      },
    }),
    NestjsFormDataModule,
  ],
  exports: [StorageService, SftpService, BunnyService, TineyeService],
  // controllers: [StorageController, BunnyController],
  providers: [StorageService, SftpService, BunnyService, TineyeService],
})
export class StorageModule {}
