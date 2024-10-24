import { Inject, Injectable } from '@nestjs/common';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { StorageService } from 'src/storage/services/storage.service';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly storageService: StorageService,
  ) {}

  readRandomUsernames() {
    const usernames = fs
      .readFileSync(
        path.join(process.cwd(), './prisma/random_username.csv'),
        'utf-8',
      )
      .split('\n');

    return usernames;
  }

  async seed() {
    const usernames = this.readRandomUsernames();

    usernames.forEach(async (username) => {
      const keycloakUser = await this.keycloakService.createUser(
        username.trim(),
        'photographer',
      );
      await this.userRepository.createIfNotExist({
        id: keycloakUser.id,
        mail: `${username}@gmail.com`,
        name: username,
        cover: Constants.DEFAULT_COVER,
        quote: '',
        avatar: Constants.DEFAULT_AVATAR,
        location: 'TP.Hồ Chí Minh',
        phonenumber: '',
        expertises: ['phong cảnh'],
        ftpPassword: '',
        ftpUsername: '',
        socialLinks: [''],
        packageCount: BigInt('999'),
        maxPhotoQuota: BigInt('999999999'),
        maxPackageCount: BigInt('99999'),
        photoQuotaUsage: BigInt('0'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`created photographer ${username}`);
    });
  }
}
