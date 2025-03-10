import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { NewsfeedService } from './services/newsfeed.service';
import { NewsfeedController } from './controllers/newsfeed.controller';
import { PhotoModule } from 'src/photo/photo.module';
import { NewsfeedCommentService } from './services/newsfeed-comment.service';
import { NewsfeedCommentController } from './controllers/newsfeed-comment.controller';
import { NewsfeedLikeService } from './services/newsfeed-like.service';
import { NewsfeedLikeController } from './controllers/newsfeed-like.controller';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule, PhotoModule],
  providers: [NewsfeedService, NewsfeedCommentService, NewsfeedLikeService],
  controllers: [
    NewsfeedController,
    NewsfeedCommentController,
    NewsfeedLikeController,
  ],
})
export class NewsfeedModule {}
