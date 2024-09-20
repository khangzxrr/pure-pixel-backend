import { ApiProperty } from '@nestjs/swagger';

export class PhotographerDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  quote: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor({ ...data }: Partial<PhotographerDTO>) {
    Object.assign(this, data);
  }
}
