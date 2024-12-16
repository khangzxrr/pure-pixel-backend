import { ApiProperty } from '@nestjs/swagger';
import {
  IsFile,
  MaxFileSize,
  HasMimeType,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class AcceptWithdrawalTransactionDto {
  @ApiProperty({
    type: 'file',
  })
  @IsFile()
  @MaxFileSize(209715200)
  @HasMimeType(['image/*'])
  photo: MemoryStoredFile;
}
