import { PrismaService } from 'src/prisma.service';
import { PopularCameraDatapointRepository } from './popular-camera-data-point.repository';

describe('PopularCameraDatapointRepository', () => {
  it('upsert should create the data point without updating', () => {
    const popularCameraDataPoint = {
      upsert: jest.fn().mockReturnValue('point'),
    };
    const repository = new PopularCameraDatapointRepository({
      popularCameraDataPoint,
    } as unknown as PrismaService);

    expect(repository.upsert('timeline', 'camera', 3)).toBe('point');
    expect(popularCameraDataPoint.upsert).toHaveBeenCalledWith({
      where: {
        cameraId_timelineId: { cameraId: 'camera', timelineId: 'timeline' },
      },
      update: {},
      create: {
        camera: { connect: { id: 'camera' } },
        timeline: { connect: { id: 'timeline' } },
        userCount: 3,
      },
    });
  });
});
