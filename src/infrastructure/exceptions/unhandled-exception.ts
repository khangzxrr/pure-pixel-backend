import { InternalServerErrorException } from '@nestjs/common';

export class UnhandledException extends InternalServerErrorException {
  constructor(e) {
    super(e, {
      description: UnhandledException.name,
    });
  }
}
