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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { TransactionService } from '../services/transaction.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { TransactionDto } from '../dtos/transaction.dto';
import { FindAllTransactionDto } from 'src/payment/dtos/rest/find-all-transaction.dto';
import { TransactionUpdateDto } from '../dtos/transaction-update.dto';
import { Request } from 'express';

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
