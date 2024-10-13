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
import { WithdrawalTransactionRepository } from './repositories/withdrawal-transaction.repository';
import { PhotoSharingRepository } from './repositories/photo-sharing.repository';
import { PhotoSellRepository } from './repositories/photo-sell.repository';
import { PhotoBuyRepository } from './repositories/photo-buy.repository';
import { UserToUserRepository } from './repositories/user-to-user-transaction.repository';
import { ReportRepository } from './repositories/report.repository';
import { PhotoTagRepository } from './repositories/photo-tag.repository';
import { PhotoVoteRepository } from './repositories/photo-vote.repository';
@Module({
  providers: [
    PrismaService,
    UserRepository,
    PhotoRepository,
    PhotoSharingRepository,
    CategoryRepository,
    UpgradePackageRepository,
    UpgradePackageOrderRepository,
    TransactionRepository,
    CommentRepository,
    ServiceTransactionRepository,
    DatabaseService,
    DepositTransactionRepository,
    WithdrawalTransactionRepository,
    PhotoBuyRepository,
    PhotoSellRepository,
    UserToUserRepository,
    ReportRepository,
    PhotoTagRepository,
    PhotoVoteRepository,
  ],
  exports: [
    PrismaService,
    UserRepository,
    PhotoRepository,
    PhotoSharingRepository,
    CategoryRepository,
    UpgradePackageRepository,
    UpgradePackageOrderRepository,
    TransactionRepository,
    CommentRepository,
    ServiceTransactionRepository,
    DatabaseService,
    DepositTransactionRepository,
    WithdrawalTransactionRepository,
    PhotoBuyRepository,
    PhotoSellRepository,
    UserToUserRepository,
    ReportRepository,
    PhotoTagRepository,
    PhotoVoteRepository,
  ],
})
export class DatabaseModule {}
