import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TransactionRepository } from 'src/database/repositories/transaction.repository';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { TransactionNotFoundException } from '../exceptions/transaction-not-found.exception';
import { AmountIsNotEqualException } from '../exceptions/amount-is-not-equal.exception';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';

@Injectable()
export class SepayService {
  constructor(
    @Inject() private readonly transactionRepository: TransactionRepository,
    @Inject() private readonly keycloakService: KeycloakService,
  ) {}

  // async cancelAllPendingUpgradeOrderTransaction(id: string) {}

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
        await this.transactionRepository.updateSuccessTransactionAndActivateUpgradeOrder(
          transaction.id,
          sepay,
        );
        await this.keycloakService.addRoleToUser(
          transaction.userId,
          Constants.PHOTOGRAPHER_ROLE,
        );
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
