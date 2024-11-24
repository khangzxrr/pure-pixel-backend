import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { BookmarkService } from './services/bookmark.service';
import { BookmarkController } from './controllers/bookmark.controller';
import { AuthenModule } from 'src/authen/authen.module';

@Module({
  imports: [DatabaseModule, StorageModule, AuthenModule],
  providers: [BookmarkService],
  controllers: [BookmarkController],
})
export class BookmarkModule {}
