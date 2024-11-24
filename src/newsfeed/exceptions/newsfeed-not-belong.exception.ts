import { BadRequestException } from '@nestjs/common';

export class NewsfeedNotBelongException extends BadRequestException {
  constructor() {
    super(NewsfeedNotBelongException.name);
  }
}
