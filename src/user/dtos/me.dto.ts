import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Constants } from 'src/infrastructure/utils/constants';

export class UserDto extends ResponseBaseDto {
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

  @ApiProperty()
  id: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quote: string;

  constructor(user: UserEntity, role: string) {
    super(user.id);
    this.mapAsCustomer(user);

    if (role == Constants.PHOTOGRAPHER_ROLE) {
      this.mapAsPhotographer(user);
    }
  }

  mapAsCustomer(user: UserEntity) {
    this.cover = user.cover;
    this.location = user.location;
    this.avatar = user.avatar;
    this.name = user.name;
    this.quote = user.quote;

    this.mail = user.mail;
    this.phonenumber = user.phonenumber;
    this.socialLinks = user.socialLinks;
    this.expertises = user.expertises;

    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  mapAsPhotographer(user: UserEntity) {
    this.photoQuotaUsage = user.photoQuotaUsage.toString();

    this.packageCount = user.packageCount.toString();
    this.maxPhotoQuota = user.maxPhotoQuota.toString();
    this.maxPackageCount = user.maxPackageCount.toString();

    this.ftpUsername = user.ftpUsername;
    this.ftpPassword = user.ftpPassword;
  }
}
