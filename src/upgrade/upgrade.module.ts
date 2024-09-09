import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UpgradeService } from './services/upgrade.service';
import { UpgradeController } from './controllers/upgrade.controller';

@Module({
  imports: [DatabaseModule],
  providers: [UpgradeService],
  controllers: [UpgradeController],
})
export class UpgradeModule {}
