import { CameraRepository } from 'src/database/repositories/camera.repository';
import { PopularCameraDatapointRepository } from 'src/database/repositories/popular-camera-data-point.repository';
import { PopularCameraTimelineRepository } from 'src/database/repositories/popular-camera-timeline.repository';
import { PrismaService } from 'src/prisma.service';
import { UpdateTimelineService } from './update-timeline.service.cron';

describe('UpdateTimelineService', () => {
  const now = new Date('2026-09-15T00:00:00.000Z');
  const dayMs = 1000 * 60 * 60 * 24;

  let popularCameraTimelineRepository: jest.Mocked<
    Pick<PopularCameraTimelineRepository, 'upsert' | 'count'>
  >;
  let popularCameraDatapointRepository: jest.Mocked<
    Pick<PopularCameraDatapointRepository, 'upsert'>
  >;
  let cameraRepository: jest.Mocked<
    Pick<CameraRepository, 'findTopUsageAtTimestamp'>
  >;
  let prismaService: { $transaction: jest.Mock };
  let service: UpdateTimelineService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    popularCameraTimelineRepository = {
      upsert: jest.fn(),
      count: jest.fn(),
    };
    popularCameraDatapointRepository = {
      upsert: jest.fn(),
    };
    cameraRepository = {
      findTopUsageAtTimestamp: jest.fn(),
    };
    prismaService = {
      $transaction: jest.fn().mockResolvedValue([]),
    };

    popularCameraTimelineRepository.upsert.mockImplementation(
      async (timestamp: Date) =>
        ({ id: `timeline-${timestamp.toISOString()}` }) as never,
    );
    //Postgres count() comes back as bigint; CameraUsageDto converts it to a number
    cameraRepository.findTopUsageAtTimestamp.mockResolvedValue([
      {
        id: 'c1',
        name: 'Cam 1',
        userCount: BigInt(4),
        date: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'c2',
        name: 'Cam 2',
        userCount: BigInt(2),
        date: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    popularCameraDatapointRepository.upsert.mockImplementation(
      (timelineId: string, cameraId: string, count: number) =>
        ({ timelineId, cameraId, count }) as never,
    );

    service = new UpdateTimelineService(
      popularCameraTimelineRepository as unknown as PopularCameraTimelineRepository,
      popularCameraDatapointRepository as unknown as PopularCameraDatapointRepository,
      cameraRepository as unknown as CameraRepository,
      prismaService as unknown as PrismaService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should only generate data for today when enough timelines exist', async () => {
    popularCameraTimelineRepository.count.mockResolvedValue(7);

    await service.triggerCron();

    expect(popularCameraTimelineRepository.count).toHaveBeenCalledWith({
      timestamp: { lte: now },
    });
    expect(popularCameraTimelineRepository.upsert).toHaveBeenCalledTimes(1);
    expect(popularCameraTimelineRepository.upsert).toHaveBeenCalledWith(now);
    expect(cameraRepository.findTopUsageAtTimestamp).toHaveBeenCalledWith(
      'day',
      5,
      now,
    );

    const timelineId = `timeline-${now.toISOString()}`;
    expect(popularCameraDatapointRepository.upsert).toHaveBeenCalledWith(
      timelineId,
      'c1',
      4,
    );
    expect(popularCameraDatapointRepository.upsert).toHaveBeenCalledWith(
      timelineId,
      'c2',
      2,
    );
    expect(prismaService.$transaction).toHaveBeenCalledWith([
      { timelineId, cameraId: 'c1', count: 4 },
      { timelineId, cameraId: 'c2', count: 2 },
    ]);
  });

  it('should backfill previous 7 days when timelines are missing', async () => {
    popularCameraTimelineRepository.count.mockResolvedValue(2);

    await service.triggerCron();

    const upsertDates = popularCameraTimelineRepository.upsert.mock.calls.map(
      ([date]) => date.getTime(),
    );

    expect(upsertDates).toEqual([
      ...[1, 2, 3, 4, 5, 6, 7].map((i) => now.getTime() - dayMs * i),
      now.getTime(),
    ]);
    expect(prismaService.$transaction).toHaveBeenCalledTimes(8);
  });

  it('should propagate transaction errors', async () => {
    popularCameraTimelineRepository.count.mockResolvedValue(10);
    prismaService.$transaction.mockRejectedValue(new Error('tx failed'));

    await expect(service.triggerCron()).rejects.toThrow('tx failed');
  });
});
