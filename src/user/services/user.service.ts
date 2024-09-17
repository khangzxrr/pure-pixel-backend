import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dto/user-filter.dto';

@Injectable()
export class UserService {
  constructor(@Inject() private readonly userRepository: UserRepository) {}

  async findOne(userFilterDto: UserFilterDto) {
    return await this.userRepository.findOne(userFilterDto);
  }
}
