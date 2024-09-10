import { Body, Controller, Inject, Post } from '@nestjs/common';
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
}
