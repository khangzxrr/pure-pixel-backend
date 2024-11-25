import { ApiProperty } from '@nestjs/swagger';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Exclude, Expose } from 'class-transformer';
import { Constants } from 'src/infrastructure/utils/constants';

export class UserDto extends ResponseBaseDto {
  @ApiProperty()
  roles: string[] = [];

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  username: string;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
  photoQuotaUsage: string;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
  packageCount: string;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
  maxPhotoQuota: string;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
  maxPackageCount: string;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
  ftpUsername: string;

  @Expose({ groups: [Constants.PHOTOGRAPHER_ROLE] })
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
