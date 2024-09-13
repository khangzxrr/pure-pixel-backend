import { Module } from '@nestjs/common';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { HttpModule } from '@nestjs/axios';
import { SftpService } from './services/sftp.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: [StorageService, SftpService],
  controllers: [StorageController],
  providers: [StorageService, SftpService],
})
export class StorageModule {}
