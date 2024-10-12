import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { ReportService } from './services/report.service';
import { ReportController } from './controllers/report.controller';
@Module({
  imports: [DatabaseModule, AuthenModule],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
