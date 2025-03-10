import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { Utils } from 'src/infrastructure/utils/utils';
import { PrismaService } from 'src/prisma.service';
import { SftpService } from 'src/storage/services/sftp.service';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { StreamChat } from 'stream-chat';
import * as tvkd from 'tieng-viet-khong-dau';

@Injectable()
export class AuthenService {
  private readonly logger = new Logger(AuthenService.name);
  private readonly streamChatClient = StreamChat.getInstance(
    process.env.STREAM_ACCESS_KEY,
    process.env.STREAM_SECRET_KEY,
  );

  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private sftpService: SftpService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private prisma: PrismaService,
  ) {}
  async createUserIfNotExist(userId: string, username: string, email: string) {
    await this.prisma.$transaction(
      async (tx) => {
        const userFilterDto = new UserFilterDto();
        userFilterDto.id = userId;

        if (
          await this.cache.get<UserEntity>(`authen:user:${userFilterDto.id}`)
        ) {
          this.logger.log(`user is exist in cache, skip creation`);
          return;
        }

        const existUser = await this.userRepository.findUniqueTransaction(
          userFilterDto,
          tx,
        );

        if (existUser != null) {
          this.cache.set(`authen:user:${userId}`, existUser, 300000);

          this.logger.log(`user is exist in DB, skip creation`);
          return;
        }

        const newUser = new UserEntity({
          id: userId,
        });
        newUser.ftpUsername = `${username}${Utils.randomString(5)}`;
        newUser.name = username;
        newUser.avatar = Constants.DEFAULT_AVATAR;
        newUser.cover = Constants.DEFAULT_COVER;
        newUser.normalizedName = tvkd.cLowerCase(username);

        newUser.ftpPassword = Utils.randomString(12);

        // await this.sftpService.registerNewSftpUser(
        //   userId,
        //   newUser.ftpUsername,
        //   email,
        //   newUser.ftpPassword,
        // );
        //
        await this.streamChatClient.upsertUser({
          id: userId,
          name: username,
        });

        await this.userRepository.createIfNotExistTransaction(newUser, tx);

        this.logger.log(`create new user to database,`);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
