import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserRepository } from './repositories/user.repository';
import { PhotoRepository } from './repositories/photo.repository';
import { CategoryRepository } from './repositories/category.repository';
import { UpgradePackageRepository } from './repositories/upgrade-package.repository';
import { UpgradePackageOrderRepository } from './repositories/upgrade-package-order.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { CommentRepository } from './repositories/comment.repository';
import { DatabaseService } from './database.service';
import { ServiceTransactionRepository } from './repositories/service-transaction.repository';
import { DepositTransactionRepository } from './repositories/deposit-transaction.repository';
@Module({
  providers: [
    PrismaService,
    UserRepository,
    PhotoRepository,
    CategoryRepository,
    UpgradePackageRepository,
    UpgradePackageOrderRepository,
    TransactionRepository,
    CommentRepository,
    ServiceTransactionRepository,
    DatabaseService,
    DepositTransactionRepository,
  ],
  exports: [
    PrismaService,
    UserRepository,
    PhotoRepository,
    CategoryRepository,
    UpgradePackageRepository,
    UpgradePackageOrderRepository,
    TransactionRepository,
    CommentRepository,
    ServiceTransactionRepository,
    DatabaseService,
    DepositTransactionRepository,
  ],
})
export class DatabaseModule {}
