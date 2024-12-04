import {
  Controller,
  Get,
  Inject,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TemporaryfileService } from '../services/temporary-file.service';
import { Response } from 'express';

@Controller('temporary-file')
@ApiTags('temporary-file')
export class TemporaryfileController {
  constructor(
    @Inject() private readonly temporaryfileService: TemporaryfileService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get buffer from filename',
  })
  async getBufferFromfilename(
    @Query('path') path: string,
    @Res() res: Response,
  ) {
    const buffer = await this.temporaryfileService.pathToBuffer(path);

    const stream = new StreamableFile(buffer);

    res.set({
      'Content-type': 'image/jpeg',
    });
    stream.getStream().pipe(res);
  }
}
