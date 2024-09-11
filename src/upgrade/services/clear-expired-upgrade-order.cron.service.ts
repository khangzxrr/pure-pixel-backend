import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';

@Injectable()
export class ClearExpiredUpgradeOrder {
  private readonly logger: Logger = new Logger(ClearExpiredUpgradeOrder.name);
  constructor(
    @Inject() private readonly upgradeOrder: UpgradePackageOrderRepository,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async clearExpired() {
    const currentDate = new Date();
    //find using current date
    const expiredOrders =
      await this.upgradeOrder.findManyActivateAndExpired(currentDate);

    //TODO: notify to photographer
    //
    //
    //TODO: what if photographer has booking on going

    await this.upgradeOrder.deactivateActivatedAndExpired(currentDate);

    this.logger.log(`deactivated ${expiredOrders.length} upgrade orders`);
  }
}
