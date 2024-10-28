import { HasMimeType, IsFile, MemoryStoredFile } from 'nestjs-form-data';

export class BookingUploadRequestDto {
  @IsFile()
  @HasMimeType(['image/jpeg', 'image/png'])
  file: MemoryStoredFile;
}
