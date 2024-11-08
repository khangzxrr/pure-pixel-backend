import { OmitType } from '@nestjs/swagger';
import { PricetagDto } from './price-map.dto';

export class CreatePriceMapDto extends OmitType(PricetagDto, [
  'preview',
] as const) {}
