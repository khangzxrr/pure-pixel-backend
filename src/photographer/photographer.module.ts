import { Module } from '@nestjs/common';
import { PhotographerController } from './controllers/photographer.controller';
import { PhotographerService } from './services/photographer.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthenModule } from 'src/authen/authen.module';
import { PhotoModule } from 'src/photo/photo.module';
import { FollowingService } from './services/following.service';
import { FollowingController } from './controllers/following.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { CachingModule } from 'src/caching/caching.module';

@Module({
  controllers: [PhotographerController, FollowingController],
  providers: [PhotographerService, FollowingService],
  imports: [
    DatabaseModule,
    StorageModule,
    AuthenModule,
    PhotoModule,
    CachingModule,
  ],
})
export class PhotographerModule {}
