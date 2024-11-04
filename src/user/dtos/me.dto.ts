import { ApiProperty } from '@nestjs/swagger';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Exclude } from 'class-transformer';

export class MeDto extends ResponseBaseDto {
  @ApiProperty()
  photoQuotaUsage: string;

  @ApiProperty()
  packageCount: string;

  @ApiProperty()
  maxPhotoQuota: string;

  @ApiProperty()
  maxPackageCount: string;

  @ApiProperty()
  ftpUsername: string;

  @ApiProperty()
  ftpPassword: string;

  @ApiProperty()
  cover: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  mail: string;

  @ApiProperty()
  phonenumber: string;

  @ApiProperty()
  socialLinks: string[];

  @ApiProperty()
  expertises: string[];

  @Exclude()
  normalizedName: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quote: string;
}
