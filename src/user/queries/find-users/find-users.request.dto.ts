import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, MaxLength } from "class-validator";
import { PaginatedQueryRequestDto } from "src/infrastructure/restful/paginated-query.request.dto";

export class FindUsersRequestDto extends PaginatedQueryRequestDto {
  @ApiProperty({ example: 'khang@gmail.com', description: 'email of user' })
  @IsOptional()
  @MaxLength(50)
  @IsEmail()
  readonly email?: string;

}
