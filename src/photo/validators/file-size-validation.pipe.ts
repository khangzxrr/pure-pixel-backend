import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { PhotoConstant } from '../constants/photo.constant';

//only the size of the uploaded file is read
interface SizedFile {
  size: number;
}

@Injectable()
export class PhotoValidationPipe implements PipeTransform<SizedFile, boolean> {
  transform(value: SizedFile, _metadata: ArgumentMetadata) {
    return value.size < PhotoConstant.MIN_PHOTO_SIZE;
  }
}
