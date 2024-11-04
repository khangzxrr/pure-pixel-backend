import { Inject, Injectable } from '@nestjs/common';

import { FindAllFollowRequestDto } from '../dtos/find-all-following-dtos/find-all-following.request.dto';

import { FollowRepository } from 'src/database/repositories/follow.repository';
import { plainToInstance } from 'class-transformer';
import { FollowDto } from '../dtos/following-dto';
import { FindAllFollowResponseDto } from '../dtos/find-all-following-dtos/find-all-following.response.dto';
import { FollowerFollowingCannotBeSameException } from '../exceptions/follower-following-cannot-be-same.exception';

@Injectable()
export class FollowingService {
  constructor(@Inject() private readonly followRepository: FollowRepository) {}

  async unfollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new FollowerFollowingCannotBeSameException();
    }

    const deletedFollow = await this.followRepository.delete({
      followerId_followingId: {
        followerId,
        followingId,
      },
    });

    const followDto = plainToInstance(FollowDto, deletedFollow);
    return followDto;
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new FollowerFollowingCannotBeSameException();
    }

    const follow = await this.followRepository.upsert(
      {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      {
        following: {
          connect: {
            id: followingId,
          },
        },
        follower: {
          connect: {
            id: followerId,
          },
        },
      },
    );

    const followDto = plainToInstance(FollowDto, follow);

    return followDto;
  }

  async get(followerId: string, followingId: string) {
    const follow = await this.followRepository.findUnique(
      {
        followerId_followingId: {
          followingId,
          followerId,
        },
      },
      {
        following: true,
        follower: true,
      },
    );

    const followDto = plainToInstance(FollowDto, follow);

    return followDto;
  }

  async getAllFollowerOfUserId(
    userId: string,
    findAllDto: FindAllFollowRequestDto,
  ) {
    const count = await this.followRepository.count({
      followingId: userId,
    });

    const followers: any[] = await this.followRepository.findAll(
      {
        followingId: userId,
      },
      {
        follower: true,
      },
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    const followDtos = plainToInstance(FollowDto, followers);

    const response = new FindAllFollowResponseDto(
      findAllDto.limit,
      count,
      followDtos,
    );

    return response;
  }

  async getAllFollowedByUserId(
    userId: string,
    findAllDto: FindAllFollowRequestDto,
  ) {
    console.log(userId);
    const count = await this.followRepository.count({
      followerId: userId,
    });

    const followings: any[] = await this.followRepository.findAll(
      {
        followerId: userId,
      },
      {
        following: true,
      },
      findAllDto.toSkip(),
      findAllDto.limit,
    );

    const followDtos = plainToInstance(FollowDto, followings);

    const response = new FindAllFollowResponseDto(
      findAllDto.limit,
      count,
      followDtos,
    );

    return response;
  }
}
