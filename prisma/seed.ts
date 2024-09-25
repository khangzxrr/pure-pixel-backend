import {
  PhotoStatus,
  PhotoType,
  PhotoVisibility,
  Prisma,
  PrismaClient,
  UpgradePackageStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1Id = 'd2020c98-60f5-45c2-879f-00a5df97e9cd';

  const category = {
    id: 'dd890386-7d82-415f-91f8-3891889b328c',
    name: 'khác',
    description: 'Những bức ảnh chưa phân loại',
  };

  const basicUpgradePackage = {
    name: 'Cơ bản',
    minOrderMonth: 3,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 5 * 1024 * 1024,
    maxPackageCount: 10,
    maxBookingPhotoQuota: 5 * 1024 * 1024,
    maxBookingVideoQuota: 5 * 1024 * 1024,
    price: new Prisma.Decimal(20000),
    status: UpgradePackageStatus.ENABLED,
  };

  const premiumUpgradePackage = {
    name: 'Nâng cao',
    minOrderMonth: 6,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 10 * 1024 * 1024,
    maxPackageCount: 10,
    maxBookingPhotoQuota: 10 * 1024 * 1024,
    maxBookingVideoQuota: 10 * 1024 * 1024,
    price: new Prisma.Decimal(38000),
    status: UpgradePackageStatus.ENABLED,
  };

  const signatureUpgradePackage = {
    name: 'Cao cấp',
    minOrderMonth: 12,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 20 * 1024 * 1024,
    maxPackageCount: 100,
    maxBookingPhotoQuota: 20 * 1024 * 1024,
    maxBookingVideoQuota: 20 * 1024 * 1024,
    price: new Prisma.Decimal(50000),
    status: UpgradePackageStatus.ENABLED,
  };

  await prisma.category.upsert({
    where: {
      name: category.name,
    },

    update: {
      ...category,
    },
    create: {
      ...category,
    },
  });

  //insert signaure package
  await prisma.upgradePackage.upsert({
    where: {
      name: signatureUpgradePackage.name,
    },
    update: {
      ...signatureUpgradePackage,
    },
    create: signatureUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      name: premiumUpgradePackage.name,
    },
    update: {
      ...premiumUpgradePackage,
    },
    create: premiumUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      name: basicUpgradePackage.name,
    },
    update: {
      ...basicUpgradePackage,
    },
    create: basicUpgradePackage,
  });

  await prisma.user.upsert({
    where: {
      id: user1Id,
    },
    update: {},
    create: {
      id: user1Id,
      ftpUsername: 'user1',
      ftpPassword: 'user1',
      avatar: 'https://s3-hcm-r1.s3cloud.vn/sftpgo/avatar%2Favatar.png',
      quote: 'cool!',
      name: 'user1',

      photos: {
        create: [
          {
            categoryId: category.id,
            title: 'image title',
            description: 'lorem',
            location: 'Vietnam',
            photoType: PhotoType.RAW,
            status: PhotoStatus.PENDING,
            visibility: PhotoVisibility.PUBLIC,
            photoTags: ['da lat'],
            captureTime: new Date(),
            colorGrading: {},
            exif: {},
            showExif: false,
            watermark: false,
            originalPhotoUrl:
              'https://s3-hcm-r1.s3cloud.vn/sftpgo/d2020c98-60f5-45c2-879f-00a5df97e9cd/dalat.jpg',
            watermarkPhotoUrl:
              'https://s3-hcm-r1.s3cloud.vn/sftpgo/d2020c98-60f5-45c2-879f-00a5df97e9cd/dalat.jpg',

            watermarkThumbnailPhotoUrl:
              'https://s3-hcm-r1.s3cloud.vn/sftpgo/d2020c98-60f5-45c2-879f-00a5df97e9cd/dalat.jpg',
            thumbnailPhotoUrl:
              'https://s3-hcm-r1.s3cloud.vn/sftpgo/d2020c98-60f5-45c2-879f-00a5df97e9cd/dalat.jpg',
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    process.exit(1);
  });
