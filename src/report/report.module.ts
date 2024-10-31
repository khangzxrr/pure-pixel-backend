import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { ReportService } from './services/report.service';
import { ManagerReportController } from './controllers/manager-report.controller';
import { StorageModule } from 'src/storage/storage.module';
import { PhotoModule } from 'src/photo/photo.module';
import { UserReportController } from './controllers/user-report.controller';
@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule, PhotoModule],
  providers: [ReportService],
  controllers: [ManagerReportController, UserReportController],
})
export class ReportModule {}
