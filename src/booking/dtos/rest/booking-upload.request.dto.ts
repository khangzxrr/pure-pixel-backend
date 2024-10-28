import { ApiProperty } from '@nestjs/swagger';
import { HasMimeType, IsFile, MemoryStoredFile } from 'nestjs-form-data';

export class BookingUploadRequestDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @HasMimeType(['image/jpeg', 'image/png'])
  file: MemoryStoredFile;
}
