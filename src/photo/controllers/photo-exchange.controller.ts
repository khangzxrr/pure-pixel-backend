import { Controller, Get, NotImplementedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoExchangeService } from '../services/photo-exchange.service';

@Controller('photo-exchange')
@ApiTags('photo-exchange')
export class PhotoExchangeController {
  constructor(private readonly photoExchange: PhotoExchangeService) {}

  @Get('/me/photo-buy')
  @ApiOperation({
    summary: 'get all photo-buys of me',
  })
  async findAllPhotobuys() {
    throw new NotImplementedException();
  }
}
