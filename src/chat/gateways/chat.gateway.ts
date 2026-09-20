import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Logger, UseGuards } from '@nestjs/common';
import WebsocketAuthGuard, {
  AuthenticatedSocket,
} from 'src/authen/guards/ws.auth.guard';
import { Server } from 'socket.io';
import { Roles } from 'src/authen/oidc';
import { Constants } from 'src/infrastructure/utils/constants';
import { MessageDto } from '../dtos/message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
  transports: ['websocket'],
})
export class ChatGateway {
  private logger: Logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server!: Server;

  @UseGuards(WebsocketAuthGuard)
  @Roles({
    roles: [
      Constants.PHOTOGRAPHER_ROLE,
      Constants.CUSTOMER_ROLE,
      Constants.MANAGER_ROLE,
      Constants.ADMIN_ROLE,
    ],
  })
  @SubscribeMessage('join-chat')
  async joinChat(@ConnectedSocket() socket: AuthenticatedSocket) {
    this.logger.log(
      `socket: ${socket.id} with user id: ${socket.user.sub} join chat`,
    );

    socket.join(socket.user.sub);
  }

  emitMessage(userIds: string[], message: MessageDto): void {
    this.server.to(userIds).emit('chat-message', message);
  }
}
