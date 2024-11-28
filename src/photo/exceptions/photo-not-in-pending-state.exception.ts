import { BadRequestException } from '@nestjs/common';

export class PhotoNotInPendingStateException extends BadRequestException {
  constructor() {
    super(PhotoNotInPendingStateException.name);
  }
}
