import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SepayRequestDto } from '../dtos/sepay.request.dto';
import { SepayService } from '../services/sepay.service';

@Controller('ipn/sepay')
@ApiTags('payment')
export class SepayController {
  constructor(@Inject() private readonly sepayService: SepayService) {}

  @Post()
  async paymentWebhook(@Body() sepayRequest: SepayRequestDto) {
    return await this.sepayService.processTransaction(sepayRequest);
  }

  @Get(`/test`)
  async testWebhook(
    @Query('transactionid') transactionId: string,
    @Query('amount') amount: number,
  ) {
    //mock sepayRequestDto
    const sepayRequest = new SepayRequestDto();
    sepayRequest.content = transactionId.replaceAll('-', ' ');
    sepayRequest.transferAmount = amount;

    return await this.sepayService.processTransaction(sepayRequest);
  }
}
