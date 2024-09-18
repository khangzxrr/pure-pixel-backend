import {
  PhotoStatus,
  PhotoType,
  PhotoVisibility,
  PrismaClient,
  UpgradePackageStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1Id = 'd2020c98-60f5-45c2-879f-00a5df97e9cd';

  const categoryName = 'landscape';
  const categoryDescription = 'trees! I love trees!';

  const basicUpgradePackage = {
    name: 'basic',
    description: {},
    price: 100000,
    quotaSize: 1024 * 5,
    bookingQuotaSize: 1024 * 5,
    status: UpgradePackageStatus.ENABLED,
  };

  const premiumUpgradePackage = {
    name: 'premium',
    description: {},
    price: 200000,
    quotaSize: 1024 * 10,
    bookingQuotaSize: 1024 * 10,
    status: UpgradePackageStatus.ENABLED,
  };

  const signatureUpgradePackage = {
    name: 'signaure',
    description: {},
    price: 300000,
    quotaSize: 1024 * 15,
    bookingQuotaSize: 1024 * 15,
    status: UpgradePackageStatus.ENABLED,
  };

  const category = await prisma.category.upsert({
    where: {
      name: categoryName,
    },

    update: {},
    create: {
      name: categoryName,
      description: categoryDescription,
    },
  });

  //insert signaure package
  await prisma.upgradePackage.upsert({
    where: {
      name: signatureUpgradePackage.name,
    },
    update: {},
    create: signatureUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      name: premiumUpgradePackage.name,
    },
    update: {},
    create: premiumUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      name: basicUpgradePackage.name,
    },
    update: {},
    create: basicUpgradePackage,
  });

  await prisma.user.upsert({
    where: {
      id: user1Id,
    },
    update: {},
    create: {
      id: user1Id,
      diskQuota: 1024 * 5,
      diskUsage: 0,
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
