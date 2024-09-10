import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UpgradeService } from './services/upgrade.service';
import { UpgradeController } from './controllers/upgrade.controller';
import { UpgradeOrderService } from './services/upgrade-order.service';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule],
  providers: [UpgradeService, UpgradeOrderService],
  exports: [UpgradeService, UpgradeOrderService],
  controllers: [UpgradeController],
})
export class UpgradeModule {}
