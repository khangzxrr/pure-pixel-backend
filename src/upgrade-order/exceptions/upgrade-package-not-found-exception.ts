import { BadRequestException } from '@nestjs/common';

export class UpgradePackageNotFoundException extends BadRequestException {
  constructor() {
    super(UpgradePackageNotFoundException.name);
  }
}
