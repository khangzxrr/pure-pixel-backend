import { Controller, Get } from "@nestjs/common";

@Controller('photo')
export class ImageExchangeController {

  @Get(':id/sell')
  async test() {

  }
}
