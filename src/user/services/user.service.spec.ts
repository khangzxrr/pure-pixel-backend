import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { BunnyService } from 'src/storage/services/bunny.service';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { Constants } from 'src/infrastructure/utils/constants';

import { User } from '@prisma/client';

describe('UserService', () => {
  let userService: UserService;

  const userRepository = {
    update: async (id: string, obj: any) => obj,
  };

  const keycloakService = {
    updateById: async (id: string, obj: any) => {},
  };
  const bunnyService = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
        {
          provide: BunnyService,
          useValue: bunnyService,
        },
        {
          provide: KeycloakService,
          useValue: keycloakService,
        },
      ],
    }).compile();

    userService = moduleRef.get(UserService);
  });

  describe('updateFunction', () => {
    it('should return updated fields when all of update fields is valid', async () => {
      jest
        .spyOn(keycloakService, 'updateById')
        .mockReturnValue(Promise.resolve());

      const user: User = {
        id: '',
        photoQuotaUsage: BigInt(0),
        maxPackageCount: BigInt(0),
        normalizedName: 'VoNgocKhang',
        maxPhotoQuota: BigInt(0),
        packageCount: BigInt(0),
        socialLinks: [],
        phonenumber: '0919092211',
        ftpUsername: '',
        ftpPassword: '',
        expertises: [],
        updatedAt: new Date(),
        createdAt: new Date(),
        location: 'Vietnam',
        avatar: '',
        quote: '',
        cover: '',
        name: 'VoNgocKhang',
        mail: 'khangzxrr@gmail.com',
      };

      jest.spyOn(userRepository, 'update').mockResolvedValue(user);

      const uuid = `895aaa1e-2574-406b-95c3-1c51ede9f232`;

      const mail = 'khangzxrr@gmail.com';

      const result = await userService.update(uuid, {
        mail: 'khangzxrr@gmail.com',
        role: Constants.PHOTOGRAPHER_ROLE,
        enabled: true,
        name: 'VoNgocKhang',
        quote: 'ThisIsAQuote',
        location: 'VietNam',
        expertises: ['firstExpertise', 'secondExpertise'],
        phonenumber: '0919092211',
        socialLinks: ['firstSocial', 'secondSocial'],
      });

      expect(result).toBe(user);
    });

    it(`should throw exception when keycloak cannot update user`, async () => {});
  });
});
