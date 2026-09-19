import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { ChangeLogController } from './controllers/change-log.controller';
import { ChangeLogService } from './services/change-log.service';

@Module({
  //StorageModule provides SftpService, which RoleGuard injects
  imports: [DatabaseModule, StorageModule, AuthenModule],
  providers: [ChangeLogService],
  controllers: [ChangeLogController],
})
export class ChangeLogModule {}
