import { NotFoundException } from '@nestjs/common';

export class UpgradePackageNotFoundException extends NotFoundException {
  constructor() {
    super(UpgradePackageNotFoundException.name);
  }
}
