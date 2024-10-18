import { Injectable } from '@nestjs/common';
import { StreamChat } from 'stream-chat';
@Injectable()
export class ChatService {
  private getStream() {
    const client = StreamChat.getInstance(
      process.env.STREAM_ACCESS_KEY,
      process.env.STREAM_SECRET_KEY,
    );

    return client;
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
