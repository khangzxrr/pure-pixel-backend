import { Module } from '@nestjs/common';
import { PhotographerController } from './controllers/photographer.controller';
import { PhotographerService } from './services/photographer.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [PhotographerController],
  providers: [PhotographerService],
  imports: [DatabaseModule],
})
export class PhotographerModule {}
