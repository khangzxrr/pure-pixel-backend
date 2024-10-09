import { BadRequestException } from '@nestjs/common';

export class UnrecognizedAdobeSidecarException extends BadRequestException {
  constructor() {
    super(UnrecognizedAdobeSidecarException.name);
  }
}
