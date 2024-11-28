import { ApiProperty } from '@nestjs/swagger';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  FileSystemStoredFile,
} from 'nestjs-form-data';

export class FileSystemPhotoUploadRequestDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  // @MinFileSize(4e6)
  @MaxFileSize(209715200)
  @HasMimeType(['image/*'])
  file: FileSystemStoredFile;
}
