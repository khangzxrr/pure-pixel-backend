import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Constants } from 'src/infrastructure/utils/constants';

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
  sellingPhotoCount: number = 0;

  @ApiProperty()
  normalPhotoCount: number = 0;

  @ApiProperty()
  totalPhotoCount: number = 0;

  @ApiProperty()
  myBookingCount: number = 0;

  @ApiProperty()
  otherBookingCount: number = 0;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
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
