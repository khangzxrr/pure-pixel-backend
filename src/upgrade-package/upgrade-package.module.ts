import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UpgradePackageController } from './controllers/upgrade-package.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';
import { UpgradePackageService } from './services/upgrade-package.service';
import { ManageUpgradePackageController } from './controllers/manage-upgrade-package.controller';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule],
  controllers: [UpgradePackageController, ManageUpgradePackageController],
  providers: [UpgradePackageService],
})
export class UpgradePackageModule {}
