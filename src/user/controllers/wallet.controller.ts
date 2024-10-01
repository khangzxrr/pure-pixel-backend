import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { ParsedUserDto } from '../dtos/parsed-user.dto';
import { WalletService } from '../services/wallet.service';
import { WalletDto } from '../dtos/wallet.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';
import { CreateDepositRequestDto } from '../dtos/rest/create-deposit.request.dto';
import { CreateDepositResponseDto } from '../dtos/rest/create-deposit.response.dto';

@Controller('wallet')
@ApiTags('wallet')
export class WalletController {
  constructor(@Inject() private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'get wallet info of logged user',
  })
  @ApiOkResponse({
    type: WalletDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getWallet(@AuthenticatedUser() user: ParsedUserDto) {
    return await this.walletService.getWalletByUserId(user.sub);
  }

  @Post('/deposit')
  @ApiOperation({
    summary: 'create a deposit request to wallet',
  })
  @ApiOkResponse({
    type: CreateDepositResponseDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async createDeposit(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createDepositDto: CreateDepositRequestDto,
  ) {
    return await this.walletService.createDeposit(user.sub, createDepositDto);
  }

  @Get('/transaction')
  @ApiOperation({
    summary: 'get users wallet transaction',
  })
  @ApiOkResponsePaginated(TransactionDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getTransactions(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllTransactionDto: FindAllTransactionDto,
  ) {
    return await this.walletService.findAllTransactionByUserId(
      user.sub,
      findAllTransactionDto,
    );
  }
}
