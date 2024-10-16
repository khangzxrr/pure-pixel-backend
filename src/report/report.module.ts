import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { ReportService } from './services/report.service';
import { ReportController } from './controllers/report.controller';
import { StorageModule } from 'src/storage/storage.module';
import { PhotoModule } from 'src/photo/photo.module';
@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule, PhotoModule],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
