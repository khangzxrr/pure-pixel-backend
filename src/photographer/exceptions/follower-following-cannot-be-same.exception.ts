import { BadRequestException } from '@nestjs/common';

export class FollowerFollowingCannotBeSameException extends BadRequestException {
  constructor() {
    super(FollowerFollowingCannotBeSameException.name);
  }
}
