import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { PhotoshootPackageDto } from '../photoshoot-package.dto';

export class PhotoshootPackageFindAllResponseDto extends PagingPaginatedResposneDto<PhotoshootPackageDto> {}
