import { Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ChatService } from '../services/chat.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { Request } from 'express';

@Controller('chat')
@ApiTags('chat')
export class ChatController {
  constructor(@Inject() private readonly chatService: ChatService) {}

  @Post('sync-all-user')
  @ApiOperation({
    summary: 'sync all user to streamDB',
  })
  async syncAllUser() {
    return await this.chatService.syncAllUsers();
  }

  @Post('auth')
  @ApiOperation({
    summary: 'auth chat token',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({
    roles: [
      Constants.PHOTOGRAPHER_ROLE,
      Constants.CUSTOMER_ROLE,
      Constants.MANAGER_ROLE,
    ],
  })
  @Public(false)
  async authChatToken(@AuthenticatedUser() user: ParsedUserDto) {
    return await this.chatService.signChatToken(user.sub);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'webhook from getstream message',
  })
  async webhookMessage(@Req() req: Request) {
    await this.chatService.processWebhook(req.body);
  }
}
