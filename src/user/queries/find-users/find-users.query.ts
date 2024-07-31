import { PaginatedQueryBase } from "src/infrastructure/ddd/query.base";

export class FindUsersQuery extends PaginatedQueryBase {
  readonly email?: string;

  constructor(limit: number, page: number, offset: number, email?: string) {
    super(limit, offset, page);

    this.email = email;

  }
}
