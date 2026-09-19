import { PrismaService } from 'src/prisma.service';
import { PhotoTagRepository } from './photo-tag.repository';

describe('PhotoTagRepository', () => {
  const extendedPhotoTag = { groupBy: jest.fn(), deleteMany: jest.fn() };
  const photoTag = { create: jest.fn() };
  const repository = new PhotoTagRepository({
    photoTag,
    extendedClient: () => ({ photoTag: extendedPhotoTag }),
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('groupBy should group public photo tags by name', () => {
    extendedPhotoTag.groupBy.mockReturnValue(['group']);

    expect(repository.groupBy(10)).toEqual(['group']);
    expect(extendedPhotoTag.groupBy).toHaveBeenCalledWith({
      by: ['name'],
      take: 10,
      _count: { photoId: true },
      orderBy: { _count: { photoId: 'desc' } },
      where: { photo: { visibility: 'PUBLIC' } },
    });
  });

  it('deleteByPhotoId should delete tags of the photo', () => {
    extendedPhotoTag.deleteMany.mockReturnValue({ count: 1 });

    expect(repository.deleteByPhotoId('p')).toEqual({ count: 1 });
    expect(extendedPhotoTag.deleteMany).toHaveBeenCalledWith({
      where: { photo: { id: 'p' } },
    });
  });

  it('create should connect the tag to the photo', () => {
    photoTag.create.mockReturnValue('tag');

    expect(repository.create('p', 'sunset')).toBe('tag');
    expect(photoTag.create).toHaveBeenCalledWith({
      data: { name: 'sunset', photo: { connect: { id: 'p' } } },
    });
  });
});
