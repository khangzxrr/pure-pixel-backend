import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { ReportDto } from '../report.dto';

export class ReportFindAllResponseDto extends PagingPaginatedResposneDto<ReportDto> {}
