import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { PhotoConstant } from '../constants/photo.constant';

@Injectable()
export class PhotoValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value.size < PhotoConstant.MIN_PHOTO_SIZE;
  }
}
