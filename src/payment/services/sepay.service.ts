import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { AmountIsNotEqualException } from '../exceptions/amount-is-not-equal.exception';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { DatabaseService } from 'src/database/database.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UpgradePackageOrderRepository } from 'src/database/repositories/upgrade-package-order.repository';
import { Transaction, UpgradeOrder } from '@prisma/client';

@Injectable()
export class SepayService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject()
    private readonly upgradeOrderRepository: UpgradePackageOrderRepository,
    @Inject() private readonly databaseService: DatabaseService,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly userRepository: UserRepository,
  ) {}

  async handleUpgradeToPhotographer(
    transaction: Transaction,
    order: UpgradeOrder,
    sepay: SepayRequestDto,
  ) {
    const updateTransactionAndUpgradeOrderQuery =
      this.transactionRepository.updateSuccessTransactionAndActivateUpgradeOrder(
        transaction.id,
        sepay,
      );
    const updateUserMaxQuotaQuery = this.userRepository.updateMaxQuotaByUserId(
      transaction.userId,
      order.maxPhotoQuota,
      order.maxPackageCount,
      order.maxBookingPhotoQuota,
      order.maxBookingVideoQuota,
    );

    await this.databaseService.applyTransactionMultipleQueries([
      updateTransactionAndUpgradeOrderQuery,
      updateUserMaxQuotaQuery,
    ]);

    await this.keycloakService.addRoleToUser(
      transaction.userId,
      Constants.PHOTOGRAPHER_ROLE,
    );
  }

  async processTransaction(sepay: SepayRequestDto) {
    const transactionId = sepay.content.replaceAll(' ', '-');

    const transaction = await this.transactionRepository.getById(transactionId);

    if (transaction == null) {
      throw new TransactionNotFoundException();
    }

    if (transaction.status === 'SUCCESS') {
      return HttpStatus.OK;
    }

    if (transaction.amount.toNumber() != sepay.transferAmount) {
      throw new AmountIsNotEqualException();
    }

    switch (transaction.type) {
      case 'UPGRADE_TO_PHOTOGRAPHER':
        await this.handleUpgradeToPhotographer(
          transaction,
          transaction.upgradeOrder,
          sepay,
        );
        break;
      case 'IMAGE_SELL':
        break;
      case 'IMAGE_BUY':
        break;
      case 'FIRST_BOOKING_PAYMENT':
        break;
      case 'SECOND_BOOKING_PAYMENT':
        break;
    }

    return HttpStatus.OK;
  }
}
