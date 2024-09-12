import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';

@Injectable()
export class ClearExpiredUpgradeOrder {
  private readonly logger: Logger = new Logger(ClearExpiredUpgradeOrder.name);
  constructor(
    @Inject() private readonly upgradeOrder: UpgradePackageOrderRepository,
    @InjectQueue('smtp') private smtpQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyToPhotographerTheirUpgradePackageWillExpiredSoon() {
    const currentDate = new Date();
    const oneWeekLaterDate = new Date(
      currentDate.setDate(currentDate.getDay() + 7),
    );

    const soonExpiredOrders =
      await this.upgradeOrder.findManyActivateAndExpired(oneWeekLaterDate);

    soonExpiredOrders.forEach((o) => {});
  }
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
