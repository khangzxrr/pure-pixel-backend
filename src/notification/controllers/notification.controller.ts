import { Controller, Get, Inject } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { Public } from 'nest-keycloak-connect';

@Controller('notification')
export class NotificationController {
  constructor(
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  @Get('/test')
  @Public()
  async test() {
    await this.notificationService.sendToSpecificUserByUserId(
      'a5a43960-42fe-4d09-bc94-ad7d9866b320',
    );
  }
}
