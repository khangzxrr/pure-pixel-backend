import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PaymentUrlDto } from '../dtos/payment-url.dto';
import { SepayService } from '../services/sepay.service';

@Controller('payment')
@ApiTags('payment')
export class TransactionController {
  constructor(
    @Inject() private readonly transactionService: TransactionService,
    @Inject() private readonly sepayService: SepayService,
  ) {}

  @Get('/transaction/:id')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async getTransactionById(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.transactionService.findById(user.sub, id);
  }

  @Post('/transaction/:id/generate-payment-url')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    type: PaymentUrlDto,
  })
  async generatePaymentUrl(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') transactionId: string,
  ) {
    return await this.transactionService.generatePaymentUrl(
      user.sub,
      transactionId,
    );
  }
}
