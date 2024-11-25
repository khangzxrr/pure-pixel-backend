import { BadRequestException } from '@nestjs/common';
import { FailedToUpdateUserException } from 'src/user/exceptions/cannot-update-user.exception';

export class FailToParsePhotoException extends BadRequestException {
  constructor() {
    super(FailedToUpdateUserException.name);
  }
}
