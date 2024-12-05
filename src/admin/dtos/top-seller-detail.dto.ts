import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';
import { TopSoldPhotoDto } from './top-sold-photo.dto';
import { PhotoshootPackageDto } from 'src/photoshoot-package/dtos/photoshoot-package.dto';

export class TopSellerDetailDto {
  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => TopSoldPhotoDto)
  topSoldPhotoDtos: TopSoldPhotoDto[];

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PhotoshootPackageDto)
  topPhotoshootPackages: PhotoshootPackageDto[];

  @ApiProperty()
  photoSellRevenue: number = 0;
}
