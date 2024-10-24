import { Module } from '@nestjs/common';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { SftpService } from './services/sftp.service';
import { AxiosRetryModule } from 'nestjs-axios-retry';
import axiosRetry from 'axios-retry';
import { BunnyService } from './services/bunny.service';
import { BunnyController } from './controllers/bunny.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';

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
  exports: [StorageService, SftpService, BunnyService],
  controllers: [StorageController, BunnyController],
  providers: [StorageService, SftpService, BunnyService],
})
export class StorageModule {}
