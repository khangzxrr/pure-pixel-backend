import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateKeycloakUserDto } from './create-keycloak-user.dto';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';
import { IsBoolean } from 'class-validator';

export class UpdateKeycloakUserDto extends PartialType(
  OmitType(CreateKeycloakUserDto, ['username'] as const),
) {
  @ApiPropertyOptional()
  @ToBoolean()
  @IsBoolean()
  enabled?: boolean;
}
