import { HttpStatus } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Response } from 'express';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { NotificationConstant } from '../constants/notification.constant';
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { NotificationFindAllDto } from '../dtos/rest/notification-find-all.request.dto';
import { NotificationService } from '../services/notification.service';
import { NotificationController } from './notification.controller';

describe('NotificationController', () => {
  let queue: jest.Mocked<Pick<Queue, 'add'>>;
  let notificationService: jest.Mocked<Pick<NotificationService, 'findAll'>>;
  let controller: NotificationController;

  beforeEach(() => {
    queue = { add: jest.fn() };
    notificationService = { findAll: jest.fn() };

    controller = new NotificationController(
      queue as unknown as Queue,
      notificationService as unknown as NotificationService,
    );
  });

  it('should queue notification and respond 202', async () => {
    const dto: NotificationCreateDto = {
      userId: 'u1',
      title: 't',
      content: 'c',
      type: 'IN_APP',
      referenceType: 'CHAT',
      payload: {},
    };
    const sendStatus = jest.fn();

    await controller.sendNotification(dto, {
      sendStatus,
    } as unknown as Response);

    expect(queue.add).toHaveBeenCalledWith(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      dto,
    );
    expect(sendStatus).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
  });

  it('should not respond when queueing fails', async () => {
    queue.add.mockRejectedValue(new Error('redis'));
    const sendStatus = jest.fn();

    await expect(
      controller.sendNotification(
        {} as NotificationCreateDto,
        {
          sendStatus,
        } as unknown as Response,
      ),
    ).rejects.toThrow('redis');
    expect(sendStatus).not.toHaveBeenCalled();
  });

  it('should get notifications of authenticated user', async () => {
    const dto = Object.assign(new NotificationFindAllDto(), {
      limit: 1,
      page: 0,
    });
    const response = { objects: [] };
    notificationService.findAll.mockResolvedValue(response as never);

    await expect(
      controller.getAllNotification(
        { sub: 'u1' } as unknown as ParsedUserDto,
        dto,
      ),
    ).resolves.toBe(response);
    expect(notificationService.findAll).toHaveBeenCalledWith('u1', dto);
  });
});
