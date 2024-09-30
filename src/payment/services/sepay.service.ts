import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { AmountIsNotEqualException } from '../exceptions/amount-is-not-equal.exception';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { DatabaseService } from 'src/database/database.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { ServiceTransactionRepository } from 'src/database/repositories/service-transaction.repository';

@Injectable()
export class SepayService {
  constructor(
    @Inject()
    private readonly serviceTransactionRepository: ServiceTransactionRepository,
    @Inject()
    private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly databaseService: DatabaseService,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly userRepository: UserRepository,
  ) {}

  async handleUpgradeToPhotographer(
    userId: string,
    serviceTransactionId: string,
    sepay: SepayRequestDto,
  ) {
    const serviceTransaction = await this.serviceTransactionRepository.findById(
      serviceTransactionId,
      true,
    );

    const updateTransactionAndUpgradeOrderQuery =
      this.serviceTransactionRepository.updateSuccessServiceTransactionAndActivateUpgradeOrder(
        serviceTransactionId,
        sepay,
      );

    const updateUserMaxQuotaQuery = this.userRepository.updateMaxQuotaByUserId(
      userId,
      serviceTransaction.upgradeOrder.upgradePackageHistory.maxPhotoQuota,
      serviceTransaction.upgradeOrder.upgradePackageHistory.maxPackageCount,
      serviceTransaction.upgradeOrder.upgradePackageHistory
        .maxBookingPhotoQuota,
      serviceTransaction.upgradeOrder.upgradePackageHistory
        .maxBookingVideoQuota,
    );

    await this.databaseService.applyTransactionMultipleQueries([
      updateTransactionAndUpgradeOrderQuery,
      updateUserMaxQuotaQuery,
    ]);

    await this.keycloakService.addRoleToUser(
      userId,
      Constants.PHOTOGRAPHER_ROLE,
    );
  }

  async processTransaction(sepay: SepayRequestDto) {
    const transactionId = sepay.content.replaceAll(' ', '-');

    const transaction = await this.transactionRepository.findById(
      transactionId,
      true,
      true,
      true,
      true,
    );

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
          transaction.userId,
          transaction.serviceTransaction.id,
          sepay,
        );
        break;
      case 'IMAGE_SELL':
        break;
      case 'IMAGE_BUY':
        break;
    }

    return HttpStatus.OK;
  }
}
