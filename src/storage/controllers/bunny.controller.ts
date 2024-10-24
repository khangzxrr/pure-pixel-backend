import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BunnyService } from '../services/bunny.service';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('bunny')
@ApiTags('bunny')
export class BunnyController {
  constructor(@Inject() private readonly bunnyService: BunnyService) {}

  @Get()
  @ApiOperation({
    summary: 'find all files',
  })
  async findAllFile() {
    return await this.bunnyService.bunnyFileList();
  }

  @Get('/presigned')
  @ApiOperation({
    summary: 'get presigned file',
  })
  async getPresignedFile() {
    return await this.bunnyService.getPresignedFile('');
  }

  @Put('/upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'upload and validate file',
  })
  @FormDataRequest()
  async uploadFile(@Body() uploadFileDto: UploadFileDto) {
    return await this.bunnyService.upload(uploadFileDto.file);
  }
}
