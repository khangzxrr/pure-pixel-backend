import { Inject, Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import WebsocketAuthGuard, {
  AuthenticatedSocket,
} from 'src/authen/guards/ws.auth.guard';
import { PhotoConstant } from '../constants/photo.constant';
import { Server, Socket } from 'socket.io';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: PhotoConstant.WEBSOCKET_GATEWAY,
})
export class PhotoGateway
  implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
  private logger: Logger = new Logger(PhotoGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDisconnect(client: Socket) {}

  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('join-photo-process-notification-room')
  async joinEvent(socket: AuthenticatedSocket) {
    this.logger.log(
      `socket: ${socket.id} with user id: ${socket.user.sub} join`,
    );

    // this.addSocketIdToSetByUserId(socket.user.sub, socket.id);
  }

  async getSetOfSocketIdsByUserId(
    userId: string,
  ): Promise<Set<string> | undefined> {
    return await this.cacheManager.get<Set<string>>(userId);
  }

  async addSocketIdToSetByUserId(userId: string, socketId: string) {
    let arrayOfSocketIds: Set<string> | undefined =
      await this.cacheManager.get<Set<string>>(userId);

    //not found => create new array of socket ids
    if (!arrayOfSocketIds) {
      arrayOfSocketIds = new Set<string>();
    }

    arrayOfSocketIds.add(socketId);

    //TTL should longer than keycloak access token expired value
    await this.cacheManager.set(userId, arrayOfSocketIds, 1000 * 60 * 60);

    this.logger.log(`add ${socketId} to sets`);
  }

  async sendDataToUserId(userId: string, event: string, data: unknown) {
    const socketIds = await this.getSetOfSocketIdsByUserId(userId);

    if (!socketIds) {
      this.logger.log(`no socket ids with user id ${userId}`);
      return;
    }
    const arrayOfSocketIds: string[] = Array.from(socketIds.values());

    this.server.to(arrayOfSocketIds).emit(event, data);

    this.logger.log(`emited event ${event} to user ${userId}`);
  }

  async sendFinishWatermarkEventToUserId(userId: string, data: unknown) {
    const socketIds = await this.getSetOfSocketIdsByUserId(userId);

    if (!socketIds) {
      this.logger.log(`no socket ids with user id ${userId}`);
      return;
    }
    const arrayOfSocketIds: string[] = Array.from(socketIds.values());

    this.server.to(arrayOfSocketIds).emit('finish-watermark-photo', data);

    this.logger.log(`emited to user`);
  }

  async sendFinishProcessPhotoEventToUserId(userId: string, data: unknown) {
    const socketIds = await this.getSetOfSocketIdsByUserId(userId);

    if (!socketIds) {
      this.logger.log(`no socket ids with user id ${userId}`);
      return;
    }
    const arrayOfSocketIds: string[] = Array.from(socketIds.values());

    this.server.to(arrayOfSocketIds).emit('finish-process-photos', data);

    this.logger.log(`emited to user`);
  }
}
