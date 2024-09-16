import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import WebsocketAuthGuard from 'src/authen/guards/ws.auth.guard';

@WebSocketGateway(4800, { cors: { origin: '*' } })
export class PhotoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: any) {
    console.log(client);
  }
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  handleDisconnect(client: any) {
    console.log(client);
  }

  //TODO: code role guard for websocket
  // @UseGuards(WebsocketAuthGuard, KeycloakRoleGuard)
  // @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @UseGuards(WebsocketAuthGuard)
  @SubscribeMessage('test')
  async testEvent(socket: any) {
    console.log(socket);
    console.log('success message!');
  }
}
