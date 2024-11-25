import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { NotificationConstant } from '../constants/notification.constant';

import { Inject, Logger, UseGuards } from '@nestjs/common';
import WebsocketAuthGuard from 'src/authen/guards/ws.auth.guard';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Server } from 'socket.io';
import { Roles } from 'nest-keycloak-connect';
import { Constants } from 'src/infrastructure/utils/constants';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: NotificationConstant.NOTIFICATION_GATEWAY,
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  handleConnection(client: any, ...args: any[]) {}

  handleDisconnect(client: any) {}

  async addSocketIdToSetByUserId(userId: string, socketId: string) {
    // await this.cacheManager.del(`notification_${userId}`);

    let arrayOfSocketIds: Array<string> = await this.cacheManager.get(
      `notification:${userId}`,
    );

    //not found => create new array of socket ids
    if (!arrayOfSocketIds) {
      arrayOfSocketIds = new Array<string>();
    }

    try {
      arrayOfSocketIds.push(socketId);

      //when add fail, it will create new arrayOfSocketIds
    } catch (e) {
      await this.cacheManager.del(`notification:${userId}`);
      arrayOfSocketIds = new Array<string>();

      arrayOfSocketIds.push(socketId);
    }

    //TTL should longer than keycloak access token expired value
    await this.cacheManager.set(
      `notification:${userId}`,
      arrayOfSocketIds,
      1000 * 60 * 60 * 3,
    );

    this.logger.log(`add ${socketId} to sets`);

    console.log(await this.cacheManager.get(`notification:${userId}`));
  }

  async getSetOfSocketIdsByUserId(userId: string): Promise<Set<string>> {
    return await this.cacheManager.get<Set<string>>(`notification:${userId}`);
  }

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
  async joinEvent(socket: any) {
    this.logger.log(
      `socket: ${socket.id} with user id: ${socket.user.sub} join`,
    );

    this.addSocketIdToSetByUserId(socket.user.sub, socket.id);
  }

  async sendRefreshNotificationEvent(userId: string, data: object) {
    const socketIds = await this.getSetOfSocketIdsByUserId(userId);

    if (!socketIds) {
      this.logger.log(`no socket ids with user id ${userId}`);
      return;
    }
    const arrayOfSocketIds: string[] = Array.from(socketIds.values());

    this.server.to(arrayOfSocketIds).emit('notification-event', data);

    this.logger.log(`emited event notification-event to user ${userId}`);
  }
}
