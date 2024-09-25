import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { UpgradeConstant } from '../constants/upgrade.constant';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';

@Injectable()
export class ClearExpiredUpgradeOrder {
  private readonly logger: Logger = new Logger(ClearExpiredUpgradeOrder.name);
  constructor(
    @Inject() private readonly upgradeOrder: UpgradePackageOrderRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @InjectQueue(UpgradeConstant.UPGRADE_QUEUE) private upgradeQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyToPhotographerTheirUpgradePackageWillExpiredSoon() {
    const currentDate = new Date();
    const oneWeekLaterDate = new Date(
      currentDate.setDate(currentDate.getDay() + 7),
    );

    const soonExpiredOrders =
      await this.upgradeOrder.findManyActivateAndExpired(oneWeekLaterDate);

    soonExpiredOrders.forEach((order) => {
      this.upgradeQueue.add(UpgradeConstant.SOON_EXPIRED_ORDER_NOTIFY, {
        order,
      });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async deactivateAndNotifyExpiredOrder() {
    const currentDate = new Date();
    //find using current date
    const expiredOrders =
      await this.upgradeOrder.findManyActivateAndExpired(currentDate);

    //after deactivate but there are(is) booking(s) still going
    //photographer still interact normally until booking is closed or expired
    await this.upgradeOrder.deactivateActivatedAndExpired(currentDate);

    expiredOrders.forEach(async (order) => {
      await this.keycloakService.deleteRoleFromUser(
        order.userId,
        Constants.PHOTOGRAPHER_ROLE,
      );

      this.upgradeQueue.add(UpgradeConstant.EXPIRED_ORDER_NOTIFY, {
        order,
      });
    });

    this.logger.log(`deactivated ${expiredOrders.length} upgrade orders`);
  }
}
