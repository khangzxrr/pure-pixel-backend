import { Inject, Injectable } from '@nestjs/common';
import { PhotographerService } from './photographer.service';
import { FindAllFollowingResponseDto } from '../dtos/find-all-following-dtos/find-all-following.response.dto';
import { FindAllFollowingRequestDto } from '../dtos/find-all-following-dtos/find-all-following.request.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from 'src/user/dto/user-filter.dto';
import { FollowingDto } from '../dtos/following-dto';

@Injectable()
export class FollowingService {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
    @Inject() private readonly userRepository: UserRepository,
  ) {}

  async getPhotographerWithFollow(
    userId: string,
    findAllFollowingRequestDto: FindAllFollowingRequestDto,
  ): Promise<FindAllFollowingResponseDto> {
    const photographerDtos =
      await this.photographerService.getAllPhotographerExceptUserId(
        userId,
        findAllFollowingRequestDto,
      );

    console.log(photographerDtos);

    const userFilterDto = new UserFilterDto();
    userFilterDto.id = userId;
    userFilterDto.followings = true;

    const user = await this.userRepository.findOne(userFilterDto);

    const followingDtos = photographerDtos.objects.map((p) => {
      const isFollowThisPhotographer = user.followings.some(
        (f) => f.followingId == p.id,
      );

      return new FollowingDto(p, isFollowThisPhotographer);
    });

    return new FindAllFollowingResponseDto(
      findAllFollowingRequestDto.limit,
      photographerDtos.totalRecord,
      followingDtos,
    );
  }
}
