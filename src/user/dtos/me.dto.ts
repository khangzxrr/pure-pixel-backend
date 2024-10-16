import { ApiProperty } from '@nestjs/swagger';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Exclude, Expose } from 'class-transformer';

export class UserDto extends ResponseBaseDto {
  @Exclude()
  photoQuotaUsage: string;

  @Exclude()
  packageCount: string;

  @Exclude()
  maxPhotoQuota: string;

  @Exclude()
  maxPackageCount: string;

  @Exclude()
  ftpUsername: string;

  @Exclude()
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

  @ApiProperty()
  id: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quote: string;
}
