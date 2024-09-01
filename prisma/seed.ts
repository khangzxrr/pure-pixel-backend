import {
  PhotoStatus,
  PhotoType,
  PhotoVisibility,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1Id = 'd2020c98-60f5-45c2-879f-00a5df97e9cd';

  const categoryName = 'landscape';
  const categoryDescription = 'trees! I love trees!';

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

  const user1 = await prisma.user.upsert({
    where: {
      id: user1Id,
    },
    update: {},
    create: {
      id: user1Id,
      diskQuota: 1024 * 5,
      diskUsage: 0,
      ftpEndpoint: user1Id,
      ftpUsername: 'user1',
      ftpPassword: 'user1',

      photos: {
        create: [
          {
            categoryId: category.id,
            description: 'lorem',
            location: 'Vietnam',
            photoType: PhotoType.RAW,
            status: PhotoStatus.PENDING,
            visibility: PhotoVisibility.PUBLIC,
            photoTags: ['da lat'],
            captureTime: new Date(),
            colorGrading: {},
            cameraSetting: {},
            originalPhotoUrl:
              'https://s3-hcm-r1.s3cloud.vn/sftpgo/d2020c98-60f5-45c2-879f-00a5df97e9cd/dalat.jpg',
            thumbnailPhotoUrl:
              'https://s3-hcm-r1.s3cloud.vn/sftpgo/d2020c98-60f5-45c2-879f-00a5df97e9cd/dalat.jpg',
          },
        ],
      },
    },
  });

  console.log({ category, user1 });
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
