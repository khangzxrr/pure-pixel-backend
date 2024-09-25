import { Controller, Inject } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('notification')
@ApiTags('notification')
export class NotificationController {
  constructor(
    @Inject() private readonly notificationService: NotificationService,
  ) {}
}
