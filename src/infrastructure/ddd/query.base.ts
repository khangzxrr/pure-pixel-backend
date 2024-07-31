export abstract class QueryBase { }

export abstract class PaginatedQueryBase extends QueryBase {
  limit: number;
  offset: number;
  page: number;

  constructor(limit: number, offset: number, page: number) {
    super();

    this.page = page;
    this.offset = offset;
    this.limit = limit;
  }
}
