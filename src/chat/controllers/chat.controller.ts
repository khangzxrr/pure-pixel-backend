import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ChatService } from '../services/chat.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

@Controller('chat')
@ApiTags('chat')
export class ChatController {
  constructor(@Inject() private readonly chatService: ChatService) {}

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
  async authChatToken(@AuthenticatedUser() user: ParsedUserDto) {
    return await this.chatService.signChatToken(user.sub);
  }
}
