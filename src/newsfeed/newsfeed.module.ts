import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { NewsfeedService } from './services/newsfeed.service';
import { NewsfeedController } from './controllers/newsfeed.controller';
import { PhotoModule } from 'src/photo/photo.module';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule, PhotoModule],
  providers: [NewsfeedService],
  controllers: [NewsfeedController],
})
export class NewsfeedModule {}