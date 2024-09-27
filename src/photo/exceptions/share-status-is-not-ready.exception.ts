import { BadRequestException } from '@nestjs/common';

export class ShareStatusIsNotReadyException extends BadRequestException {
  constructor() {
    super(ShareStatusIsNotReadyException.name);
  }
}
