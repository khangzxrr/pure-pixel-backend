import { BadRequestException } from '@nestjs/common';
import { ShareStatusIsNotReadyException } from './share-status-is-not-ready.exception';

export class SharePhotoUrlIsEmptyException extends BadRequestException {
  constructor() {
    super(ShareStatusIsNotReadyException.name);
  }
}
