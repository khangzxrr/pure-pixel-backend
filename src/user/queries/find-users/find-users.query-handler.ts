import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { FindUsersQuery } from "./find-users.query";
import { PrismaService } from "src/prisma.service";

@QueryHandler(FindUsersQuery)
export class FindUsersQueryHandler implements IQueryHandler {
  constructor(private prisma: PrismaService) { }

  //TODO: inject prisma then return query result
  execute(query: FindUsersQuery): Promise<Result> {
    throw new Error("Method not implemented.");
  }


}




