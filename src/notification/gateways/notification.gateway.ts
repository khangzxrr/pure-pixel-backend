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
import { Server } from 'http';

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

  handleDisconnect(client: any) {
    console.log(client);
  }

  async addSocketIdToSetByUserId(userId: string, socketId: string) {
    let arrayOfSocketIds: Set<string> = await this.cacheManager.get(userId);

    //not found => create new array of socket ids
    if (!arrayOfSocketIds) {
      arrayOfSocketIds = new Set<string>();
    }

    arrayOfSocketIds.add(socketId);

    //TTL should longer than keycloak access token expired value
    await this.cacheManager.set(userId, arrayOfSocketIds, 1000 * 60 * 60);

    this.logger.log(`add ${socketId} to sets`);
  }

  async getSetOfSocketIdsByUserId(userId: string): Promise<Set<string>> {
    return await this.cacheManager.get(userId);
  }

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('join-photo-process-notification-room')
  async joinEvent(socket: any) {
    this.logger.log(
      `socket: ${socket.id} with user id: ${socket.user.sub} join`,
    );

    this.addSocketIdToSetByUserId(socket.user.sub, socket.id);
  }
}
