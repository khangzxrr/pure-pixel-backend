import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Utils } from 'src/infrastructure/utils/utils';
import { PrismaService } from 'src/prisma.service';
import { SftpService } from 'src/storage/services/sftp.service';
import { UserFilterDto } from 'src/user/dto/user-filter.dto';
import { UserEntity } from 'src/user/entities/user.entity';

@Injectable()
export class AuthenService {
  private readonly logger = new Logger(AuthenService.name);

  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private sftpService: SftpService,
    private prisma: PrismaService,
  ) {}
  async createUserIfNotExist(userId: string, username: string, email: string) {
    await this.prisma.$transaction(
      async (tx) => {
        const userFilterDto = new UserFilterDto();
        userFilterDto.id = userId;

        const existUser = await this.userRepository.findOneTransaction(
          userFilterDto,
          tx,
        );

        if (existUser != null) {
          this.logger.log(`user is exist in DB, skip creation`);
          return;
        }

        const newUser = new UserEntity({
          id: userId,
        });
        newUser.ftpUsername = username;
        newUser.name = username;
        newUser.avatar =
          'https://s3-hcm-r1.s3cloud.vn/sftpgo/avatar%2Favatar.png';

        newUser.ftpPassword = Utils.randomString(12);

        await this.sftpService.registerNewSftpUser(
          userId,
          newUser.ftpUsername,
          email,
          newUser.ftpPassword,
        );

        await this.userRepository.createIfNotExistTransaction(newUser, tx);

        this.logger.log(`create new user to database,`);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
