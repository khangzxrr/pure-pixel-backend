import { Prisma, PrismaClient, UpgradePackageStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminId = '0ac7bfba-ccb5-45c5-bcb3-3186fdd4a255';

  const category = {
    id: 'dd890386-7d82-415f-91f8-3891889b328c',
    name: 'khác',
    description: 'Những bức ảnh chưa phân loại',
  };

  const basicUpgradePackage = {
    name: 'Cơ bản',
    minOrderMonth: 3,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 5 * 1024 * 1024 * 1024,
    maxPackageCount: 10,
    maxBookingPhotoQuota: 5 * 1024 * 1024 * 1024,
    maxBookingVideoQuota: 5 * 1024 * 1024 * 1024,
    price: new Prisma.Decimal(20000),
    status: UpgradePackageStatus.ENABLED,
  };

  const premiumUpgradePackage = {
    name: 'Nâng cao',
    minOrderMonth: 6,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 10 * 1024 * 1024 * 1024,
    maxPackageCount: 10,
    maxBookingPhotoQuota: 10 * 1024 * 1024 * 1024,
    maxBookingVideoQuota: 10 * 1024 * 1024 * 1024,
    price: new Prisma.Decimal(38000),
    status: UpgradePackageStatus.ENABLED,
  };

  const signatureUpgradePackage = {
    name: 'Cao cấp',
    minOrderMonth: 12,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 20 * 1024 * 1024 * 1024,
    maxPackageCount: 100,
    maxBookingPhotoQuota: 20 * 1024 * 1024 * 1024,
    maxBookingVideoQuota: 20 * 1024 * 1024 * 1024,
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
      name_deletedAt: {
        name: signatureUpgradePackage.name,
        deletedAt: null,
      },
    },
    update: {
      ...signatureUpgradePackage,
    },
    create: signatureUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      name_deletedAt: {
        name: premiumUpgradePackage.name,
        deletedAt: null,
      },
    },
    update: {
      ...premiumUpgradePackage,
    },
    create: premiumUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      name_deletedAt: {
        name: basicUpgradePackage.name,
        deletedAt: null,
      },
    },
    update: {
      ...basicUpgradePackage,
    },
    create: basicUpgradePackage,
  });

  await prisma.user.upsert({
    where: {
      id: adminId,
    },
    update: {},
    create: {
      id: adminId,
      avatar: 'https://s3-hcm-r1.s3cloud.vn/sftpgo/avatar%2Favatar.png',
      quote: 'đây là admin',
      name: 'admin',
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
