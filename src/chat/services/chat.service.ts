import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { StreamChat } from 'stream-chat';
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  private getStream() {
    const client = StreamChat.getInstance(
      process.env.STREAM_ACCESS_KEY,
      process.env.STREAM_SECRET_KEY,
    );

    return client;
  }

  async processWebhook(data: any) {
    console.log(`process webhook`);
    if (data.type === 'message.new') {
      console.log(`process message.new`);
      await this.notifyToOtherUser(data);
    }
  }

  async notifyToOtherUser(data) {
    const senderId = data?.message?.user?.id;
    const members: any[] = data.channel.members;
    const userOfSender = await this.userRepository.findUnique(senderId);
    for (let member of members) {
      if (member?.user_id !== senderId) {
        this.notificationService.addNotificationToQueue({
          type: 'BOTH_INAPP_EMAIL',
          title: 'Có tin nhắn mới',
          content: `Bạn vừa nhận được tin nhắn mới ${userOfSender ? `đến từ ${userOfSender.name}` : ``}`,
          userId: member.user_id,
          payload: {
            id: userOfSender.id,
          },
          referenceType: 'CHAT',
        });
      }
    }
  }

  async syncAllUsers() {
    const users = await this.userRepository.findMany(
      {},
      [],
      {},
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

  async upsertUser(userId: string, name: string, avatar: string) {
    return await this.getStream().upsertUser({
      id: userId,
      name: name,
      avatar,
    });
  }

  async signChatToken(userId: string) {
    return this.getStream().createToken(userId);
  }
}
