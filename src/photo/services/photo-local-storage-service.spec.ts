import { FileSystemStoredFile } from 'nestjs-form-data';
import { PhotoLocalStorageConfigService } from './photo-local-storage-service';

describe('PhotoLocalStorageConfigService', () => {
  it('returns file system storage config', () => {
    const service = new PhotoLocalStorageConfigService();

    expect(service.configAsync()).toEqual({
      storage: FileSystemStoredFile,
      fileSystemStoragePath: '/tmp/purepixel-local-storage',
    });
  });
});
