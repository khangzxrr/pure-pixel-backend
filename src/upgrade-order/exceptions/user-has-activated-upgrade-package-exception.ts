import { BadRequestException } from '@nestjs/common';

export class UserHasActivatedUpgradePackage extends BadRequestException {
  constructor() {
    super(UserHasActivatedUpgradePackage.name);
  }
}
