import { Inject, Injectable } from '@nestjs/common';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';

import * as fs from 'fs';
import * as path from 'path';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoUploadRequestDto } from 'src/photo/dtos/rest/photo-upload.request';
import { MemoryStoredFile } from 'nestjs-form-data';
import { PhotoProcessConsumer } from 'src/photo/consumers/photo-process.consumer';
import { UserService } from 'src/user/services/user.service';
import { DashboardDto } from '../dtos/dashboard.dto';
import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { UpgradePackageRepository } from 'src/database/repositories/upgrade-package.repository';

@Injectable()
export class AdminService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoProcessConsumer: PhotoProcessConsumer,
    @Inject() private readonly userService: UserService,
    @Inject()
    private readonly upgradePackageRepository: UpgradePackageRepository,
  ) {}

  async getDashboard(dashboardRequestDto: DashboardRequestDto) {
    const dashboardDto = new DashboardDto();

    dashboardDto.totalCustomer = 420;
    dashboardDto.totalPhotographer = 160;
    dashboardDto.totalRevenueFromUpgradePackage = 999999999;
    dashboardDto.totalRevenue = 99999999;
    dashboardDto.totalEmployee = 15;

    dashboardDto.customerDatapoints = [
      {
        total: 15,
        createdAt: new Date('2019-01-01'),
      },
      {
        total: 50,
        createdAt: new Date('2020-01-01'),
      },
      {
        total: 70,
        createdAt: new Date('2021-01-01'),
      },
      {
        total: 102,
        createdAt: new Date('2022-01-01'),
      },
      {
        total: 300,
        createdAt: new Date('2023-01-01'),
      },
      {
        total: 420,
        createdAt: new Date('2024-01-01'),
      },
    ];

    dashboardDto.photographerDatapoints = [
      {
        total: 5,
        createdAt: new Date('2019-01-01'),
      },
      {
        total: 15,
        createdAt: new Date('2020-01-01'),
      },
      {
        total: 23,
        createdAt: new Date('2021-01-01'),
      },
      {
        total: 50,
        createdAt: new Date('2022-01-01'),
      },
      {
        total: 135,
        createdAt: new Date('2023-01-01'),
      },
      {
        total: 160,
        createdAt: new Date('2024-01-01'),
      },
    ];

    const upgradePackages = await this.upgradePackageRepository.findAll(
      0,
      5,
      {},
      {},
    );

    return dashboardDto;
  }

  async syncUsers() {
    return this.userService.syncKeycloakWithDatabase();
  }

  async triggerProcess(photoId: string) {
    return this.photoProcessConsumer.processPhoto(photoId);
  }

  readRandomUsernames() {
    const usernames = fs
      .readFileSync(
        path.join(process.cwd(), './prisma/random_username.csv'),
        'utf-8',
      )
      .split('\n');

    return usernames;
  }

  readImageList() {
    const files = fs.readdirSync(path.join(process.cwd(), `./images`));

    return files;
  }

  readFileToBuffer(filepath: string) {
    const file = fs.readFileSync(path.join(process.cwd(), filepath));

    return file;
  }

  async seed() {
    const usernames = this.readRandomUsernames();

    const imageList = this.readImageList();

    console.log(usernames);
    console.log(imageList);

    const imagePerUserCount = Math.floor(imageList.length / usernames.length);

    usernames.forEach(async (username) => {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length === 0) {
        return;
      }

      const keycloakUser = await this.keycloakService.createUser(
        trimmedUsername,
        'photographer',
      );
      const user = await this.userRepository.upsert({
        id: keycloakUser.id,
        mail: `${trimmedUsername}@gmail.com`,
        name: trimmedUsername,
        cover: Constants.DEFAULT_COVER,
        quote: '',
        avatar: Constants.DEFAULT_AVATAR,
        normalizedName: trimmedUsername,
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

      for (let i = 0; i < imagePerUserCount; i++) {
        const photoUploadDto = new PhotoUploadRequestDto();
        photoUploadDto.file = new MemoryStoredFile();

        imageList.shift();

        photoUploadDto.file.buffer = this.readFileToBuffer(
          `./images/${imageList[0]}`,
        );
        photoUploadDto.file.size = photoUploadDto.file.buffer.byteLength;
        photoUploadDto.file.originalName = imageList[0];

        try {
          const photoDto = await this.photoService.uploadPhoto(
            user.id,
            'RAW',
            photoUploadDto,
          );

          await this.photoService.updatePhoto(user.id, photoDto.id, {
            visibility: 'PUBLIC',
          });
        } catch (e) {
          console.log(e);
        }

        console.log(`image = ${i} / ${imagePerUserCount}`);
      }

      console.log(
        `finished user ${username} remain: ${usernames.indexOf(username) + 1 - usernames.length} users`,
      );
    });
  }
}
