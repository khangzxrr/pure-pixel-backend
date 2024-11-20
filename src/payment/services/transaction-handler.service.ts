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

    await this.userToUserRepository.markSucccessAndCreateToUserTransaction(
      fromUserTransactionId,
      sepay,
      fromUserTransaction.toUserId,
      transaction.fee,
      transaction.amount,
    );
  }
}
