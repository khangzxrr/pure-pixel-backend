import { BadRequestException } from '@nestjs/common';

export class CannotTransferToTheSameUpgradePackage extends BadRequestException {
  constructor() {
    super(CannotTransferToTheSameUpgradePackage.name);
  }
}
