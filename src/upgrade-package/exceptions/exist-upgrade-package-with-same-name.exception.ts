import { BadRequestException } from '@nestjs/common';

export class ExistUpgradePackageWithSameNameException extends BadRequestException {
  constructor() {
    super(ExistUpgradePackageWithSameNameException.name);
  }
}
