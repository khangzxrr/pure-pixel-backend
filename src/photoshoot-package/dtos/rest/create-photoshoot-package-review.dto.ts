import { OmitType } from '@nestjs/swagger';
import { PhotoshootPackageReviewDto } from '../photoshoot-package-review.dto';

export class CreatePhotoshootPackageReviewDto extends OmitType(
  PhotoshootPackageReviewDto,
  ['id', 'user'] as const,
) {}
