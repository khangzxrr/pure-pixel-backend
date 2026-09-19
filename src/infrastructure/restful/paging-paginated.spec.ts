import { plainToInstance } from 'class-transformer';
import { PagingPaginatedRequestDto } from './paging-paginated.request.dto';
import { PagingPaginatedResposneDto } from './paging-paginated.response.dto';

describe('paging paginated dtos', () => {
  it('request dto should convert values to numbers and compute skip', () => {
    const dto = plainToInstance(PagingPaginatedRequestDto, {
      limit: '10',
      page: '3',
    });

    expect(dto.limit).toBe(10);
    expect(dto.page).toBe(3);
    expect(dto.toSkip()).toBe(30);
  });

  it('response dto should compute total pages', () => {
    const dto = new PagingPaginatedResposneDto(10, 25, ['a']);

    expect(dto.totalPage).toBe(3);
    expect(dto.totalRecord).toBe(25);
    expect(dto.objects).toEqual(['a']);
  });

  it('response dto should return zero pages for zero limit', () => {
    expect(new PagingPaginatedResposneDto(0, 25, []).totalPage).toBe(0);
  });
});
