import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { StreamChat } from 'stream-chat';
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(@Inject() private readonly userRepository: UserRepository) {}

  private getStream() {
    const client = StreamChat.getInstance(
      process.env.STREAM_ACCESS_KEY,
      process.env.STREAM_SECRET_KEY,
    );

    return client;
  }

  async syncAllUsers() {
    const users = await this.userRepository.findMany(
      {},
      [],
      0,
      Number.MAX_VALUE,
    );

    users.forEach(async (user) => {
      await this.getStream().upsertUser({
        id: user.id,
        name: user.name,
      });

      this.logger.log(`synced userId: ${user.id} name: ${user.name}`);
    });

    return users.length;
  }

  async upsertUser(userId: string, name: string) {
    console.log('upsert stream user');
    return await this.getStream().upsertUser({
      id: userId,
      name: name,
    });
  }

  async signChatToken(userId: string) {
    return this.getStream().createToken(userId);
  }
}
