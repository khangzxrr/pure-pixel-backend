import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { NotificationConstant } from '../constants/notification.constant';

import { Logger, UseGuards } from '@nestjs/common';
import WebsocketAuthGuard from 'src/authen/guards/ws.auth.guard';
import { Server, Socket } from 'socket.io';
import { Roles } from 'nest-keycloak-connect';
import { Constants } from 'src/infrastructure/utils/constants';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: NotificationConstant.NOTIFICATION_GATEWAY,
  transports: ['websocket'],
})
export class NotificationGateway {
  private logger: Logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  private server: Server;

  @UseGuards(WebsocketAuthGuard)
  @Roles({
    roles: [
      Constants.PHOTOGRAPHER_ROLE,
      Constants.CUSTOMER_ROLE,
      Constants.MANAGER_ROLE,
      Constants.ADMIN_ROLE,
    ],
  })
  @SubscribeMessage('join-notification-room')
  async joinEvent(@ConnectedSocket() socket: any) {
    this.logger.log(
      `socket: ${socket.id} with user id: ${socket.user.sub} join`,
    );

    const userId = socket.user.sub;

    const socketClient = socket as Socket;

    socketClient.join(userId);
  }

  async sendRefreshNotificationEvent(userId: string, data: object) {
    this.server.to(userId).emit('notification-event', data);

    this.logger.log(`emited event notification-event to user ${userId}`);
  }
}
