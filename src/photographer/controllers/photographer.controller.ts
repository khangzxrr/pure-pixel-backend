import { Controller, Inject } from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('photographer')
@ApiTags('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}
}
