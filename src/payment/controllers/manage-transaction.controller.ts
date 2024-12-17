import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { TransactionService } from '../services/transaction.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from 'src/payment/dtos/rest/find-all-transaction.dto';
import { TransactionUpdateDto } from '../dtos/transaction-update.dto';
import { Request } from 'express';
import { AcceptWithdrawalTransactionDto } from '../dtos/rest/accept-withdrawal-transaction.dto';
import { FormDataRequest, NestjsFormDataModule } from 'nestjs-form-data';
import { DenyWithdrawalTransactionDto } from '../dtos/rest/deny-withdrawal-transaction.dto';

@Controller('manager/transaction')
@ApiTags('manager-manage-transaction')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.ADMIN_ROLE, Constants.MANAGER_ROLE] })
export class ManageTransactionController {
  constructor(
    @Inject() private readonly transactionService: TransactionService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get all transactions',
  })
  @ApiOkResponsePaginated(TransactionDto)
  async findAll(
    @Query() findAllDto: FindAllTransactionDto,
    @Req() req: Request,
  ) {
    return await this.transactionService.findAll(findAllDto, req.url);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update transaction by id',
  })
  @ApiOkResponse({
    type: TransactionDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: TransactionUpdateDto,
  ) {
    return await this.transactionService.update(id, updateDto);
  }

  @Patch(':id/withdrawal/accept')
  @ApiOkResponse({
    type: TransactionDto,
  })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  async acceptWithdrawal(
    @Param('id') id: string,
    @Body() acceptDto: AcceptWithdrawalTransactionDto,
  ) {
    return await this.transactionService.acceptWithdrawal(id, acceptDto);
  }

  @Patch(':id/withdrawal/deny')
  async denyWithdrawal(
    @Param('id') id: string,
    @Body() denyDto: DenyWithdrawalTransactionDto,
  ) {
    return await this.transactionService.denyWithdrawal(id, denyDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'get transaction by id',
  })
  @ApiOkResponse({
    type: TransactionDto,
  })
  async findById(@Param('id') id: string) {
    return await this.transactionService.findById(id);
  }
}
