import {
  Controller,
  Get,
  Inject,
  NotImplementedException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { SignedPhotoDto } from 'src/photo/dtos/photo.dto';
import {
  AuthenticatedUser,
  AuthGuard,
  Public,
  Roles,
} from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { ParsedUserDto } from 'src/user/dto/parsed-user.dto';
import { FindAllPhotographerRequestDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.request.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { PhotographerDTO } from '../dtos/photographer.dto';
import { PagingPaginatedResposneDto } from 'src/infrastructure/restful/paging-paginated.response.dto';

@Controller('photographer')
@ApiTags('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: 'get all photographers. Ah yes I KNOW! doesnt have filter yet',
  })
  @ApiOkResponsePaginated(PhotographerDTO)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async findAllPhotographers(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllRequestDto: FindAllPhotographerRequestDto,
  ): Promise<PagingPaginatedResposneDto<PhotographerDTO>> {
    console.log(findAllRequestDto);

    if (user) {
      return this.photographerService.getAllPhotographerExceptUserId(
        user.sub,
        findAllRequestDto,
      );
    }

    return this.photographerService.getAllPhotographerExceptUserId(
      '',
      findAllRequestDto,
    );
  }

  //TODO: finish get all packages of photographer API
  @Get('/:id/package')
  @ApiOperation({
    summary: 'get all packages of photographer',
  })
  async findAllPackages() {
    throw new NotImplementedException();
  }

  @Get('/me/photo')
  @ApiOperation({
    summary: 'get all photos of mine',
  })
  @ApiResponse({
    isArray: true,
    status: HttpStatusCode.Ok,
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async getPhotoOfMine(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query()
    filter: FindAllPhotoFilterDto,
  ) {
    return await this.photographerService.getPhotosOfMe(user.sub, filter);
  }
}
