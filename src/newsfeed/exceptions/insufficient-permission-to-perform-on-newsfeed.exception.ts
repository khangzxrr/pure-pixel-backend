import { BadRequestException } from '@nestjs/common';

export class InsufficientPermissionToPerformOnNewsfeedException extends BadRequestException {
  constructor() {
    super(InsufficientPermissionToPerformOnNewsfeedException.name);
  }
}
