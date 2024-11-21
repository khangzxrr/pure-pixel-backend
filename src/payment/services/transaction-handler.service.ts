import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { Constants } from 'src/infrastructure/utils/constants';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { ServiceTransactionRepository } from 'src/database/repositories/service-transaction.repository';
import { DatabaseService } from 'src/database/database.service';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { UserToUserRepository } from 'src/database/repositories/user-to-user-transaction.repository';
import { NotificationService } from 'src/notification/services/notification.service';

@Injectable()
export class TransactionHandlerService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject()
    private readonly serviceTransactionRepository: ServiceTransactionRepository,
    @Inject()
    private readonly databaseService: DatabaseService,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject()
    private readonly transactionRepository: TransactionRepository,

    @Inject() private readonly userToUserRepository: UserToUserRepository,
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  async handleUpgradeToPhotographer(
    userId: string,
    serviceTransactionId: string,
    paymentPayload: object,
  ) {
    const serviceTransaction = await this.serviceTransactionRepository.findById(
      serviceTransactionId,
      true,
    );

    const updateTransactionAndUpgradeOrderQuery =
      this.serviceTransactionRepository.updateSuccessServiceTransactionAndActivateUpgradeOrder(
        serviceTransactionId,
        paymentPayload,
      );

    const deactivatePreviousActiveUpgrade = this.userRepository.update(userId, {
      upgradeOrders: {
        updateMany: {
          where: {
            status: 'ACTIVE',
          },
          data: {
            status: 'CANCEL',
          },
        },
      },
    });

    const updateUserMaxQuotaQuery = this.userRepository.updateMaxQuotaByUserId(
      userId,
      serviceTransaction.upgradeOrder.upgradePackageHistory.maxPhotoQuota,
      serviceTransaction.upgradeOrder.upgradePackageHistory.maxPackageCount,
    );

    const [, updateTransactionResult] =
      await this.databaseService.applyTransactionMultipleQueries([
        deactivatePreviousActiveUpgrade,
        updateTransactionAndUpgradeOrderQuery,
        updateUserMaxQuotaQuery,
      ]);

    await this.keycloakService.deleteRolesFromUser(userId);
    await this.keycloakService.addRoleToUser(
      userId,
      Constants.PHOTOGRAPHER_ROLE,
    );

    await this.notificationService.addNotificationToQueue({
      payload: updateTransactionResult,
      title: 'Nâng cấp thành nhiếp ảnh gia thành công',
      userId,
      content:
        'Bạn đã nâng cấp tài khoản trở thành nhiếp ảnh gia, giờ bạn có thể tải ảnh lên, bán ảnh,....',
      type: 'BOTH_INAPP_EMAIL',
      referenceType: 'UPGRADE_PACKAGE',
    });
  }

  async handleDeposit(transaction: Transaction, sepay: SepayRequestDto) {
    return await this.transactionRepository.updateStatusAndPayload(
      transaction.id,
      'SUCCESS',
      sepay,
    );
  }

  async handleWithdrawal(transaction: Transaction, sepay: SepayRequestDto) {
    return await this.transactionRepository.updateStatusAndPayload(
      transaction.id,
      'SUCCESS',
      sepay,
    );
  }

  async handleBuy(
    transaction: Transaction,
    fromUserTransactionId: string,
    sepay: SepayRequestDto,
  ) {
    const fromUserTransaction = await this.userToUserRepository.getById(
      fromUserTransactionId,
    );

    const updatedTransaction =
      await this.userToUserRepository.markSucccessAndCreateToUserTransaction(
        fromUserTransactionId,
        sepay,
        fromUserTransaction.toUserId,
        transaction.fee,
        transaction.amount,
      );

    const photoTitle =
      fromUserTransaction.photoBuy.photoSellHistory.originalPhotoSell.photo
        .title;

    const width = fromUserTransaction.photoBuy.photoSellHistory.width;
    const height = fromUserTransaction.photoBuy.photoSellHistory.height;

    await this.notificationService.addNotificationToQueue({
      title: `Mua ảnh ${photoTitle} thành công`,
      content: `Bạn đã thanh toán ảnh ${photoTitle} - kích thước ${width}x${height} bằng QRcode thành công`,
      userId: transaction.userId,
      type: 'BOTH_INAPP_EMAIL',
      referenceType: 'PHOTO_BUY',
      payload: updatedTransaction,
    });

    await this.notificationService.addNotificationToQueue({
      title: `Bán ảnh ${photoTitle} thành công`,
      content: ` Người dùng ${fromUserTransaction.fromUserTransaction.user.name} đã thanh toán ảnh ${photoTitle} - kích thước ${width}x${height} thành công`,
      userId: fromUserTransaction.toUserId,
      type: 'BOTH_INAPP_EMAIL',
      referenceType: 'PHOTO_BUY',
      payload: updatedTransaction,
    });
  }
}
