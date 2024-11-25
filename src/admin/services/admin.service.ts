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

import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PhotoConstant } from 'src/photo/constants/photo.constant';

import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { DashboardReportRepository } from 'src/database/repositories/dashboard-report.repository';
import { Utils } from 'src/infrastructure/utils/utils';

@Injectable()
export class AdminService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoProcessConsumer: PhotoProcessConsumer,
    @Inject() private readonly userService: UserService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
    @Inject()
    private readonly dashboardReportRepository: DashboardReportRepository,
  ) {}

  async getDashboardReport(dashboardRequestDto: DashboardRequestDto) {
    return await this.dashboardReportRepository.findMany({
      createdAt: {
        gte: dashboardRequestDto.fromDate,
        lte: dashboardRequestDto.toDate,
      },
    });
  }

  async syncUsers() {
    return await this.userService.syncKeycloakWithDatabase();
  }

  async triggerProcessAllPhotos() {
    let skip = 0;
    while (true) {
      const photos = await this.photoRepository.findAll({}, [], skip, 100);

      const photoJobs = photos.map((p) => ({
        name: PhotoConstant.PROCESS_PHOTO_JOB_NAME,
        data: {
          id: p.id,
        },
      }));

      console.log(photoJobs);

      await this.photoProcessQueue.addBulk(photoJobs);

      skip += photos.length;

      if (photos.length === 0) {
        break;
      }
    }
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

      const keycloakUser = await this.keycloakService.upsert(
        trimmedUsername,
        `${trimmedUsername}@gmail.com`,
        Constants.PHOTOGRAPHER_ROLE,
      );

      const user = await this.userRepository.upsert({
        id: keycloakUser.id,
        mail: `${trimmedUsername}@gmail.com`,
        name: trimmedUsername,
        cover: Constants.DEFAULT_COVER,
        quote: '',
        avatar: Constants.DEFAULT_AVATAR,
        normalizedName: Utils.normalizeText(trimmedUsername),
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
