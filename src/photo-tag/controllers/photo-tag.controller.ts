import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoTagService } from '../services/photo-tag.service';
import { PhotoTagDto } from 'src/photo/dtos/photo-tag.dto';
import { PhotoTagGetTopDto } from '../dtos/rest/photo-tag-get-top.request.dto';

@Controller('photo-tag')
@ApiTags('photo-tag')
export class PhotoTagController {
  constructor(@Inject() private readonly photoTagService: PhotoTagService) {}

  @Get()
  @ApiOperation({
    summary: 'get top N of tags',
  })
  @ApiOkResponse({
    isArray: true,
    type: PhotoTagDto,
  })
  async getTopTags(@Query() getTopDto: PhotoTagGetTopDto) {
    return await this.photoTagService.getTop(getTopDto.top);
  }
}
