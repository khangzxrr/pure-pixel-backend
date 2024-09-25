import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('vqr')
@ApiTags('payment')
export class VietQrController {}
