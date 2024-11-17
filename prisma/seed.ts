import { Prisma, PrismaClient, UpgradePackageStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminId = '0ac7bfba-ccb5-45c5-bcb3-3186fdd4a255';

  const category = {
    id: 'dd890386-7d82-415f-91f8-3891889b328c',
    name: 'khác',
    description: 'Những bức ảnh chưa phân loại',
  };

  const basicUpgradePackage: Prisma.UpgradePackageCreateInput = {
    id: 'a384f1c1-0cf9-462c-b777-0cd46defc9bc',
    name: 'Cơ bản',
    minOrderMonth: 3,
    summary: 'đây là mô tả tóm tắt,...',
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 5 * 1024 * 1024 * 1024,
    maxPackageCount: 10,
    price: new Prisma.Decimal(20000),
    status: UpgradePackageStatus.ENABLED,
  };

  const premiumUpgradePackage: Prisma.UpgradePackageCreateInput = {
    id: 'aca2f420-9d03-4cd1-934d-7d1a1a318804',
    name: 'Nâng cao',
    summary: 'đây là mô tả tóm tắt,...',
    minOrderMonth: 6,
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 10 * 1024 * 1024 * 1024,
    maxPackageCount: 10,
    price: new Prisma.Decimal(38000),
    status: UpgradePackageStatus.ENABLED,
  };

  const signatureUpgradePackage: Prisma.UpgradePackageCreateInput = {
    id: 'a53c55cb-9376-4038-99e1-2ba9f233d0ec',
    name: 'Cao cấp',
    minOrderMonth: 12,
    summary: 'đây là mô tả tóm tắt,...',
    descriptions: ['description 1', 'description 2', 'description 3'],
    maxPhotoQuota: 20 * 1024 * 1024 * 1024,
    maxPackageCount: 100,
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
      id: signatureUpgradePackage.id,
    },
    update: {
      ...signatureUpgradePackage,
    },
    create: signatureUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      id: premiumUpgradePackage.id,
    },
    update: {
      ...premiumUpgradePackage,
    },
    create: premiumUpgradePackage,
  });
  await prisma.upgradePackage.upsert({
    where: {
      id: basicUpgradePackage.id,
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
