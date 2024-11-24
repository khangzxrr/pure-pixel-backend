import { BadRequestException } from '@nestjs/common';
import { NotBelongPhotoException } from './not-belong-photo.exception';

export class NotBelongCommentException extends BadRequestException {
  constructor() {
    super(NotBelongPhotoException.name);
  }
}
