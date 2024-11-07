import { ApiProperty } from '@nestjs/swagger';

export class KeycloakUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  roles: string[];
}
