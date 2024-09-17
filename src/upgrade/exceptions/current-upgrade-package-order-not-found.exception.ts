import { NotFoundException } from '@nestjs/common';

export class CurrentUpgradePackageOrderNotFound extends NotFoundException {
  constructor() {
    super(CurrentUpgradePackageOrderNotFound.name);
  }
}
