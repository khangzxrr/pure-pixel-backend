import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';
import { ResponseBaseDto } from 'src/infrastructure/restful/base.response.dto';
import { Constants } from 'src/infrastructure/utils/constants';

export class MeDto extends ResponseBaseDto {
  @ApiProperty()
  maxPhotoQuota: number;

  @ApiProperty()
  maxPackageCount: number;

  @ApiProperty()
  maxBookingPhotoQuota: number;

  @ApiProperty()
  maxBookingVideoQuota: number;

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
    this.maxPhotoQuota = user.maxPhotoQuota;
    this.maxPackageCount = user.maxPackageCount;
    this.maxBookingPhotoQuota = user.maxBookingPhotoQuota;
    this.maxBookingVideoQuota = user.maxBookingVideoQuota;
    this.ftpUsername = user.ftpUsername;
    this.ftpPassword = user.ftpPassword;
  }
}
