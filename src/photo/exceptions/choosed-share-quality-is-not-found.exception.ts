import { BadRequestException } from '@nestjs/common';

export class ChoosedShareQualityIsNotFoundException extends BadRequestException {
  constructor() {
    super(ChoosedShareQualityIsNotFoundException.name);
  }
}
