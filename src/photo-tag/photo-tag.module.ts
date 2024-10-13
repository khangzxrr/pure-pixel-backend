import { Module } from '@nestjs/common';
import { PhotoTagController } from './controllers/photo-tag.controller';
import { PhotoTagService } from './services/photo-tag.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [PhotoTagController],
  providers: [PhotoTagService],
  imports: [DatabaseModule],
})
export class PhotoTagModule {}
