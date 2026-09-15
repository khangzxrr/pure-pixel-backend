import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { Utils } from 'src/infrastructure/utils/utils';
import { StreamChat } from 'stream-chat';

export interface StreamChatChannelMember {
  user_id: string;
}

//fields of a getstream message.new webhook that are read here
export interface StreamChatNewMessagePayload {
  message: {
    user: {
      id: string;
    };
  };
  channel: {
    members: StreamChatChannelMember[];
  };
}

export type StreamChatWebhookEvent = {
  type?: string;
} & Partial<StreamChatNewMessagePayload>;

const isNewMessageEvent = (
  data: StreamChatWebhookEvent,
): data is StreamChatWebhookEvent & StreamChatNewMessagePayload =>
  data.type === 'message.new';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  private getStream() {
    const client = StreamChat.getInstance(
      Utils.env('STREAM_ACCESS_KEY'),
      process.env.STREAM_SECRET_KEY,
    );

    return client;
  }

  async processWebhook(data: StreamChatWebhookEvent) {
    console.log(`process webhook`);
    if (isNewMessageEvent(data)) {
      console.log(`process message.new`);
      await this.notifyToOtherUser(data);
    }
  }

  async notifyToOtherUser(data: StreamChatNewMessagePayload) {
    const senderId = data?.message?.user?.id;
    const members: StreamChatChannelMember[] = data.channel.members;
    const userOfSender = await this.userRepository.findUnique(senderId);
    for (const member of members) {
      if (member?.user_id !== senderId) {
        //payload needs the sender id, this used to fail here with a TypeError
        if (!userOfSender) {
          throw new Error(`sender ${senderId} of chat message not found`);
        }

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
    //stream chat is optional, skip when it is not configured
    if (!process.env.STREAM_ACCESS_KEY) {
      return null;
    }

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
