import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { PhotographerDTO } from '../photographer.dto';

export class FindAllPhotographerResponseDto extends PagingPaginatedResposneDto<PhotographerDTO> {}
