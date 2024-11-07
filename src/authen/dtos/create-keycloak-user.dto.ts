import { ApiProperty } from '@nestjs/swagger';

export class CreateKeycloakUserDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  mail: string;

  @ApiProperty()
  role: string;
}
