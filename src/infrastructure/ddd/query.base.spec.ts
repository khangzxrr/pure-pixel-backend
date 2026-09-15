import { PaginatedQueryBase, QueryBase } from './query.base';

class TestPaginatedQuery extends PaginatedQueryBase {}

describe('PaginatedQueryBase', () => {
  it('should assign paging fields', () => {
    const query = new TestPaginatedQuery(10, 20, 2);

    expect(query).toBeInstanceOf(QueryBase);
    expect(query.limit).toBe(10);
    expect(query.offset).toBe(20);
    expect(query.page).toBe(2);
  });
});
