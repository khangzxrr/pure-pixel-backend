import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoshootPackageReviewRepository } from './photoshoot-package-review.repository';

describe('PhotoshootPackageReviewRepository', () => {
  it('upsert should create the review without updating', () => {
    const review = { upsert: jest.fn().mockReturnValue('review') };
    const repository = new PhotoshootPackageReviewRepository({
      review,
    } as unknown as PrismaService);
    const where = { id: 'r' };
    const data = { star: 5 } as unknown as Prisma.ReviewCreateInput;

    expect(repository.upsert(where, data)).toBe('review');
    expect(review.upsert).toHaveBeenCalledWith({
      where,
      update: {},
      create: data,
    });
  });
});
