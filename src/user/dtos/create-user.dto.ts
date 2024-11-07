import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';
import { Constants } from 'src/infrastructure/utils/constants';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsEmail()
  mail: string;

  @ApiProperty()
  @IsNotEmpty()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g)
  phonenumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  quote: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  socialLinks: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  expertises: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsIn([
    Constants.MANAGER_ROLE,
    Constants.PHOTOGRAPHER_ROLE,
    Constants.CUSTOMER_ROLE,
    Constants.ADMIN_ROLE,
  ])
  role: string;
}
