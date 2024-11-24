import { BadRequestException } from '@nestjs/common';

export class NotBelongReportException extends BadRequestException {
  constructor() {
    super(NotBelongReportException);
  }
}
