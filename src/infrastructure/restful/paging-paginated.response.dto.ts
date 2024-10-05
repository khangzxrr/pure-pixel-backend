import { ApiProperty } from '@nestjs/swagger';

export class PagingPaginatedResposneDto<T> {
  @ApiProperty({
    description: 'total records',
  })
  totalRecord: number;

  @ApiProperty({
    description: 'total number of pages',
  })
  totalPage: number;

  @ApiProperty({
    description: 'array of objects',
  })
  objects: T[];

  constructor(limit: number, totalRecord: number, objects: T[]) {
    this.totalPage = limit === 0 ? 0 : Math.ceil(totalRecord / limit);
    this.totalRecord = totalRecord;
    this.objects = objects;
  }
}
