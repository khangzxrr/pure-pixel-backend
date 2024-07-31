import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  readonly statusCode: number;

  @ApiProperty({ example: 'Validation error' })
  readonly message: string;

  @ApiProperty({ example: 'Bad request' })
  readonly error: string;

  @ApiProperty({ example: 'DeaPgq' })
  readonly correlationId: string;

  @ApiProperty({
    example: ['incorrect email'],
    description: 'Optional list of sub-errors',
    nullable: true,
    required: false,
  })
  readonly subErrors?: string[];

}
