import { PrismaService } from 'src/prisma.service';
import { CameraMakerRepository } from './camera-maker.repository';

describe('CameraMakerRepository', () => {
  it('findAll should return all camera makers', async () => {
    const cameraMaker = { findMany: jest.fn().mockResolvedValue(['maker']) };
    const repository = new CameraMakerRepository({
      cameraMaker,
    } as unknown as PrismaService);

    await expect(repository.findAll()).resolves.toEqual(['maker']);
    expect(cameraMaker.findMany).toHaveBeenCalledWith();
  });
});
