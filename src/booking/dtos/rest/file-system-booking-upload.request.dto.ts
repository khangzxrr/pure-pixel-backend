import { ApiProperty } from '@nestjs/swagger';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  FileSystemStoredFile,
} from 'nestjs-form-data';

export class FileSystemBookngUploadDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MaxFileSize(209715200)
  @HasMimeType(['image/*'])
  file: FileSystemStoredFile;
}
