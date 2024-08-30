import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthenService {
  private readonly logger = new Logger(AuthenService.name);

  constructor(@Inject() private userRepository: UserRepository) {}

  async createUserIfNotExist(userId: string) {
    let user = await this.userRepository.getById(userId);

    if (user != null) {
      this.logger.log(`userId ${userId} is exist in database, skip create `);
      return;
    }

    user = new User(userId);
    await this.userRepository.create(user);

    this.logger.log(`create new user to database with user id: ${userId}`);
  }
}
