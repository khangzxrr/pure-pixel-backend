import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserRepository } from './repositories/user.repository';
import { PhotoRepository } from './repositories/photo.repository';
import { CategoryRepository } from './repositories/category.repository';
import { UpgradePackageRepository } from './repositories/upgrade-package.repository';
import { UpgradePackageOrderRepository } from './repositories/upgrade-package-order.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { CommentRepository } from './repositories/comment.repository';
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
  ],
})
export class DatabaseModule {}
