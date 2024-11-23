import { ApiProperty } from '@nestjs/swagger';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class PhotoshootPackageShowcaseUpdateDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MaxFileSize(5e7, {
    each: true,
  })
  @HasMimeType(['image/*'])
  showcase: MemoryStoredFile;
}
