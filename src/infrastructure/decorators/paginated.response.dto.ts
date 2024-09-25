import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PagingPaginatedResposneDto } from '../restful/paging-paginated.response.dto';

/*
    The custom decorator receives as the parameter dataDto the DTO class that will replace T in our generic DTO.
    The ApiExtraModels decorator from nestjs/swagger indicates swagger to generate and construct the OpenAPI schema for both DTOs, our PaginatedResponseDto and whatever DTO we will use to type the data attribute.
    allOf is for OpenAPI 3 to cover inheritance use-cases.
    We use getSchemaPath to retrieve the PaginatedResponseDto OpenAPI schema, and then we fine-tune its data attribute, indicating that it's of type array and that the OpenAPI schema for its items is the one generated for dataDto.
*/
export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(PagingPaginatedResposneDto, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PagingPaginatedResposneDto) },
          {
            properties: {
              objects: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
  );
