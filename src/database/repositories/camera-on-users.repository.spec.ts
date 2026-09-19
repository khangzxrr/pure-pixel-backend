import { PrismaService } from 'src/prisma.service';
import { CameraOnUsersRepository } from './camera-on-users.repository';

describe('CameraOnUsersRepository', () => {
  const cameraOnUsers = { count: jest.fn(), upsert: jest.fn() };
  const repository = new CameraOnUsersRepository({
    cameraOnUsers,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('countUserByCameraMakerId should count by camera maker', async () => {
    cameraOnUsers.count.mockResolvedValue(4);

    await expect(repository.countUserByCameraMakerId('maker')).resolves.toBe(4);
    expect(cameraOnUsers.count).toHaveBeenCalledWith({
      where: { camera: { cameraMaker: { id: 'maker' } } },
    });
  });

  it('create should upsert the camera user relation', async () => {
    cameraOnUsers.upsert.mockResolvedValue('relation');

    await expect(repository.create('camera', 'user')).resolves.toBe('relation');
    expect(cameraOnUsers.upsert).toHaveBeenCalledWith({
      where: { cameraId_userId: { cameraId: 'camera', userId: 'user' } },
      update: {},
      create: {
        user: { connect: { id: 'user' } },
        camera: { connect: { id: 'camera' } },
      },
    });
  });
});
