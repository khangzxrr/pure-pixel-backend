import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CameraDto } from '../camera.dto';
import { IsFile, MemoryStoredFile } from 'nestjs-form-data';
import { IsOptional } from 'class-validator';

export class UpdateCameraDto extends OmitType(PartialType(CameraDto), [
  'createdAt',
  'updatedAt',
  'cameraOnUsers',
  'cameraMakerId',
  'thumbnail',
] as const) {
  @ApiPropertyOptional({
    type: 'file',
  })
  @IsOptional()
  @IsFile()
  thumbnail?: MemoryStoredFile;
}
