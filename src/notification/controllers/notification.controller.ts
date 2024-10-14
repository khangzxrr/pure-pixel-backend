import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationCreateDto } from '../dtos/rest/notification-create.dto';
import { NotificationDto } from '../dtos/notification.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { NotificationConstant } from '../constants/notification.constant';
import { Queue } from 'bullmq';

import { Response } from 'express';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { NotificationFindAllDto } from '../dtos/rest/notification-find-all.request.dto';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

@Controller('notification')
@ApiTags('notification')
export class NotificationController {
  constructor(
    @InjectQueue(NotificationConstant.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'send notification to user by user id',
  })
  @ApiOkResponse({
    status: 202,
    type: NotificationDto,
  })
  async sendNotification(
    @Body() notificationCreateDto: NotificationCreateDto,
    @Res() res: Response,
  ) {
    await this.notificationQueue.add(
      NotificationConstant.TEXT_NOTIFICATION_JOB,
      notificationCreateDto,
    );

    res.sendStatus(HttpStatus.ACCEPTED);
  }

  @Get()
  @ApiOkResponsePaginated(NotificationDto)
  @ApiOperation({
    summary: 'get all notification',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getAllNotification(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() notificationFindAllDto: NotificationFindAllDto,
  ) {
    return await this.notificationService.findAll(
      user.sub,
      notificationFindAllDto,
    );
  }
}
