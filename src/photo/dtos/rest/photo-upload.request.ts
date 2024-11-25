import { ApiProperty } from '@nestjs/swagger';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class PhotoUploadRequestDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  // @MinFileSize(4e6)
  @MaxFileSize(209715200)
  @HasMimeType(['image/*'])
  file: MemoryStoredFile;
}
