import { GetTopDto } from '../dtos/rest/get-top.dto';
import { CameraService } from '../services/camera.service';
import { CameraController } from './camera.controller';

describe('CameraController', () => {
  let cameraService: jest.Mocked<
    Pick<
      CameraService,
      'findTopCameraOfBrand' | 'findTopBrand' | 'getPopularGraph' | 'findById'
    >
  >;
  let controller: CameraController;

  const topDto = Object.assign(new GetTopDto(), { top: 3 });

  beforeEach(() => {
    cameraService = {
      findTopCameraOfBrand: jest.fn(),
      findTopBrand: jest.fn(),
      getPopularGraph: jest.fn(),
      findById: jest.fn(),
    };

    controller = new CameraController(
      cameraService as unknown as CameraService,
    );
  });

  it('should get top cameras of brand', async () => {
    const cameras = [{ id: 'c1' }];
    cameraService.findTopCameraOfBrand.mockResolvedValue(cameras as never);

    await expect(
      controller.getTopCameraOfBranch('brand1', topDto),
    ).resolves.toBe(cameras);
    expect(cameraService.findTopCameraOfBrand).toHaveBeenCalledWith(
      'brand1',
      3,
    );
  });

  it('should get top brands', async () => {
    const brands = [{ userCount: 1 }];
    cameraService.findTopBrand.mockResolvedValue(brands as never);

    await expect(controller.getTopBranch(topDto)).resolves.toBe(brands);
    expect(cameraService.findTopBrand).toHaveBeenCalledWith(3);
  });

  it('should get popular graph', async () => {
    const graph = [{ id: 't1' }];
    cameraService.getPopularGraph.mockResolvedValue(graph as never);

    await expect(controller.getPopularCameraGraphs()).resolves.toBe(graph);
  });

  it('should get camera detail by id', async () => {
    const camera = { id: 'c1' };
    cameraService.findById.mockResolvedValue(camera as never);

    await expect(controller.getCameraDetailById('c1')).resolves.toBe(camera);
    expect(cameraService.findById).toHaveBeenCalledWith('c1');
  });
});
