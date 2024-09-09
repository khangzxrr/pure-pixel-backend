import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(@Inject() private readonly userRepository: UserRepository) {}

  async getByUserId(userid: string) {
    const user = await this.userRepository.getById(userid);

    return user;
  }
}
