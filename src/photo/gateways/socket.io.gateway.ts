import { Inject, Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import WebsocketAuthGuard from 'src/authen/guards/ws.auth.guard';
import { PhotoConstant } from '../constants/photo.constant';
import { Server } from 'socket.io';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: PhotoConstant.WEBSOCKET_GATEWAY,
})
export class PhotoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger(PhotoGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  handleConnection(client: any) {}
  handleDisconnect(client: any) {}

  //TODO: code role guard for websocket
  // @UseGuards(WebsocketAuthGuard, KeycloakRoleGuard)
  // @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('join')
  async joinEvent(socket: any) {
    this.logger.log(
      `socket: ${socket.id} with user id: ${socket.user.sub} join`,
    );

    this.addSocketIdToSetByUserId(socket.user.sub, socket.id);
  }

  async getSetOfSocketIdsByUserId(userId: string): Promise<Set<string>> {
    return await this.cacheManager.get(userId);
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

  async sendToUserId(userId: string, data: any) {
    //TODO: what if user disconnect before this method is called
    // handle recall
    //
    const socketIds = await this.getSetOfSocketIdsByUserId(userId);

    if (!socketIds) {
      this.logger.log(`no socket ids with user id ${userId}`);
      return;
    }
    const arrayOfSocketIds: string[] = Array.from(socketIds.values());

    this.server.to(arrayOfSocketIds).emit(data);

    this.logger.log(`emited to user`);
  }
}
