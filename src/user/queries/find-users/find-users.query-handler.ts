import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { FindUsersQuery } from "./find-users.query";
import { PrismaService } from "src/prisma.service";
import { Ok, Result } from "oxide.ts";
import { User } from "@prisma/client";

@QueryHandler(FindUsersQuery)
export class FindUsersQueryHandler implements IQueryHandler {
  constructor(private prisma: PrismaService) { }

  async execute(query: FindUsersQuery): Promise<Result<User[], Error>> {

    const result = await this.prisma.user.findMany({
      take: query.limit,
      skip: query.offset,
      where: {
        email: {
          contains: query.email,
        },
      },
    });


    return Ok(result);
  }

}
