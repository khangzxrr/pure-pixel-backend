import { $Enums, Transaction } from '@prisma/client';
import { JsonValue, Decimal } from '@prisma/client/runtime/library';
import { ApplicationEntity } from 'src/infrastructure/entities/application.entity';

export class TransactionEntity
  extends ApplicationEntity<TransactionEntity>
  implements Transaction
{
  id: string;
  userId: string;
  paymentPayload: JsonValue;
  paymentMethod: string;
  type: $Enums.TransactionType;
  status: $Enums.TransactionStatus;
  amount: Decimal;
  createdAt: Date;
  updatedAt: Date;
}