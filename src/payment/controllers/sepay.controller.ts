import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SepayRequestDto } from '../dtos/sepay.request.dto';

@Controller('ipn/sepay')
@ApiTags('payment')
export class SepayController {
  @Post()
  async paymentWebhook(@Body() sepayRequest: SepayRequestDto) {
    console.log(sepayRequest);

    return HttpStatus.OK;
  }
}
