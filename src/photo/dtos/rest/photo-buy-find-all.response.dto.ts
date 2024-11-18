import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { SignedPhotoDto } from '../signed-photo.dto';

export class PhotoBuyFindAllResponseDto extends PagingPaginatedResposneDto<SignedPhotoDto> {}
