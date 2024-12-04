import { Module } from '@nestjs/common';
import { TemporaryfileService } from './services/temporary-file.service';
import { PhotoModule } from 'src/photo/photo.module';
import { TemporaryfileController } from './controllers/temporary-file.controller';

@Module({
  controllers: [TemporaryfileController],
  imports: [PhotoModule],
  providers: [TemporaryfileService],
  exports: [TemporaryfileService],
})
export class TemporaryFileModule {}
