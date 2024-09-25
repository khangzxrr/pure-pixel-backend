import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Constants } from 'src/infrastructure/utils/constants';

export class MeDto extends ResponseBaseDto {
  @ApiProperty()
  photoQuotaUsage: string;

  @ApiProperty()
  packageCount: string;

  @ApiProperty()
  bookingPhotoQuotaUsage: string;

  @ApiProperty()
  bookingVideoQuotaUsage: string;

  @ApiProperty()
  maxPhotoQuota: string;

  @ApiProperty()
  maxPackageCount: string;

  @ApiProperty()
  maxBookingPhotoQuota: string;

  @ApiProperty()
  maxBookingVideoQuota: string;

  @ApiProperty()
  ftpUsername: string;

  @ApiProperty()
  ftpPassword: string;

  @ApiProperty()
  cover: string;

  @ApiProperty()
  location: string;

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

    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  mapAsPhotographer(user: UserEntity) {
    this.photoQuotaUsage = user.photoQuotaUsage.toString();
    this.packageCount = user.packageCount.toString();
    this.bookingPhotoQuotaUsage = user.bookingPhotoQuotaUsage.toString();
    this.bookingVideoQuotaUsage = user.bookingVideoQuotaUsage.toString();

    this.maxPhotoQuota = user.maxPhotoQuota.toString();
    this.maxPackageCount = user.maxPackageCount.toString();
    this.maxBookingPhotoQuota = user.maxBookingPhotoQuota.toString();
    this.maxBookingVideoQuota = user.maxBookingVideoQuota.toString();

    this.ftpUsername = user.ftpUsername;
    this.ftpPassword = user.ftpPassword;
  }
}
