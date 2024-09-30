import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { ParsedUserDto } from '../dtos/parsed-user.dto';
import { WalletService } from '../services/wallet.service';
import { WalletDto } from '../dtos/wallet.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from '../dtos/rest/find-all-transaction.dto';

@Controller('wallet')
@ApiTags('wallet')
export class WalletController {
  constructor(@Inject() private readonly walletService: WalletService) {}

  @Get()
  @ApiOkResponse({
    description: 'get wallet info of logged user',
  })
  @ApiOkResponse({
    type: WalletDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getWallet(@AuthenticatedUser() user: ParsedUserDto) {
    return await this.walletService.getWalletByUserId(user.sub);
  }

  @Get('/transaction')
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
