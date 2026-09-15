import { FindAllCameraDto } from '../dtos/rest/find-all-camera.dto';
import { UpdateCameraDto } from '../dtos/rest/update-camera.dto';
import { CameraService } from '../services/camera.service';
import { ManageCameraController } from './manage-camera.controller';

describe('ManageCameraController', () => {
  let cameraService: jest.Mocked<
    Pick<CameraService, 'findAll' | 'update' | 'delete'>
  >;
  let controller: ManageCameraController;

  beforeEach(() => {
    cameraService = {
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    controller = new ManageCameraController(
      cameraService as unknown as CameraService,
    );
  });

  it('should find all cameras', async () => {
    const dto = Object.assign(new FindAllCameraDto(), { limit: 1, page: 0 });
    const response = { objects: [] };
    cameraService.findAll.mockResolvedValue(response as never);

    await expect(controller.findAll(dto)).resolves.toBe(response);
    expect(cameraService.findAll).toHaveBeenCalledWith(dto);
  });

  it('should update camera', async () => {
    const dto = Object.assign(new UpdateCameraDto(), { name: 'n' });
    const camera = { id: 'c1' };
    cameraService.update.mockResolvedValue(camera as never);

    await expect(controller.updateCamera('c1', dto)).resolves.toBe(camera);
    expect(cameraService.update).toHaveBeenCalledWith('c1', dto);
  });

  it('should delete camera', async () => {
    const camera = { id: 'c1' };
    cameraService.delete.mockResolvedValue(camera as never);

    await expect(controller.deleteCamera('c1')).resolves.toBe(camera);
    expect(cameraService.delete).toHaveBeenCalledWith('c1');
  });
});
