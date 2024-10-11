import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';
import { UpgradePackageDto } from '../upgrade-package.dto';

export class UpgradePackageFindAllResposneDto extends PagingPaginatedResposneDto<UpgradePackageDto> {}
