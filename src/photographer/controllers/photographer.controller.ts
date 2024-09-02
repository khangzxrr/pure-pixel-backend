import { Controller, Inject } from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';

@Controller('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}
}
