import { Test } from '@nestjs/testing';
import { PhotoService } from './photo.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { QueueModule } from 'src/queue/queue.module';

describe('PhotoService', () => {
  let photoService: PhotoService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, StorageModule, QueueModule],
      providers: [PhotoService],
    }).compile();

    photoService = moduleRef.get<PhotoService>(PhotoService);
  });

  describe('should be defined', () => {
    it('should define service', async () => {
      expect(photoService).toBeDefined();
    });
  });
});
