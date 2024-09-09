import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Utils } from 'src/infrastructure/utils/utils';
import { PrismaService } from 'src/prisma.service';
import { SftpService } from 'src/storage/services/sftp.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthenService {
  private readonly logger = new Logger(AuthenService.name);

  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private sftpService: SftpService,
    private prisma: PrismaService,
  ) {}
  async createUserIfNotExist(userId: string, username: string, email: string) {
    const user = new User(userId);

    await this.prisma.$transaction(
      async (tx) => {
        const createdUser =
          await this.userRepository.createIfNotExistTransaction(user, tx);

        if (createdUser.ftpUsername.length !== 0) {
          return;
        }

        createdUser.ftpUsername = `${username}${new Date().getTime()}`;
        createdUser.ftpPassword = Utils.randomString(12);

        await this.sftpService.registerNewSftpUser(
          userId,
          `${username}${new Date().getTime()}`,
          email,
          Utils.randomString(12),
        );

        //update sftp profile to database
        await this.userRepository.createIfNotExistTransaction(createdUser, tx);

        this.logger.log(`create new user to database,`);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
