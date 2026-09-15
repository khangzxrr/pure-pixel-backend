import { InternalServerErrorException } from '@nestjs/common';

export class UnhandledException extends InternalServerErrorException {
  constructor(e: unknown) {
    super(e, {
      description: UnhandledException.name,
    });
  }
}
