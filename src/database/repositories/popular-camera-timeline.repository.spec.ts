import { PrismaService } from 'src/prisma.service';
import { PopularCameraTimelineRepository } from './popular-camera-timeline.repository';

describe('PopularCameraTimelineRepository', () => {
  const extendedTimeline = { count: jest.fn() };
  const popularCameraTimeline = { findMany: jest.fn(), upsert: jest.fn() };
  const repository = new PopularCameraTimelineRepository({
    popularCameraTimeline,
    extendedClient: () => ({ popularCameraTimeline: extendedTimeline }),
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('count should count through the extended client', async () => {
    extendedTimeline.count.mockResolvedValue(2);
    const where = { timestamp: { gte: new Date('2024-01-01') } };

    await expect(repository.count(where)).resolves.toBe(2);
    expect(extendedTimeline.count).toHaveBeenCalledWith({ where });
  });

  it('findMany should include data points ordered by timestamp', async () => {
    popularCameraTimeline.findMany.mockResolvedValue(['timeline']);
    const where = { id: 't' };

    await expect(repository.findMany(where)).resolves.toEqual(['timeline']);
    expect(popularCameraTimeline.findMany).toHaveBeenCalledWith({
      where,
      include: {
        popularCameraDataPoints: { include: { camera: true } },
      },
      orderBy: { timestamp: 'asc' },
    });
  });

  it('upsert should create timeline for timestamp', async () => {
    popularCameraTimeline.upsert.mockResolvedValue('timeline');
    const timestamp = new Date('2024-01-01');

    await expect(repository.upsert(timestamp)).resolves.toBe('timeline');
    expect(popularCameraTimeline.upsert).toHaveBeenCalledWith({
      where: { timestamp },
      update: {},
      create: { timestamp },
    });
  });
});
