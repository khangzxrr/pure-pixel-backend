import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { routesV1 } from "src/config/app.routes";
import { UserPaginatedResponseDto } from "src/user/dtos/user.paginated.response.dto";
import { FindUsersRequestDto } from "./find-users.request.dto";
import { FindUsersQuery } from "./find-users.query";
import { QueryBus } from "@nestjs/cqrs";

@Controller(routesV1.version)
export class FindUsersController {
  constructor(private queryBus: QueryBus) { }

  @Get(routesV1.user.root)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserPaginatedResponseDto,
  })
  async findUsers(
    @Query() queryParams: FindUsersRequestDto,
  ): Promise<string> {

    const query = new FindUsersQuery(
      queryParams.limit,
      queryParams.page,
      queryParams.offset,
      queryParams.email
    );

    const result = this.queryBus.execute(query);

    console.log(query);
    console.log(result);

    return 'test';
  }
}
