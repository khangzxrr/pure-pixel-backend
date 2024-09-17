import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { MeController } from './controllers/me.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { UserService } from './services/user.service';
import { UpgradeModule } from 'src/upgrade/upgrade.module';

@Module({
  controllers: [UserController, MeController],
  imports: [StorageModule, DatabaseModule, AuthenModule, UpgradeModule],
  providers: [UserService],
})
export class UserModule {}
