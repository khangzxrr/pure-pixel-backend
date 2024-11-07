import { PartialType } from '@nestjs/swagger';
import { CreateKeycloakUserDto } from './create-keycloak-user.dto';

export class UpdateKeycloakUserDto extends PartialType(CreateKeycloakUserDto) {}
