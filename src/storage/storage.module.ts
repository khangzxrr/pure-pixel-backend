import { Module } from '@nestjs/common';
import { StorageController } from './controllers/storage.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { StorageService } from './services/storage.service';
import { HttpModule } from '@nestjs/axios';
import { SftpService } from './services/sftp.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
    }),
  ],
  exports: [StorageService, SftpService],
  controllers: [StorageController],
  providers: [StorageService, SftpService],
})
export class StorageModule {}
