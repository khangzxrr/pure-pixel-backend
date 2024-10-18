import { Injectable } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
@Injectable()
export class ChatService {
  async signChatToken(userId: string) {
    return sign({ tokenType: 'user' }, process.env.TALKJS_SECRET_KEY, {
      issuer: process.env.TALKJS_ISSUER,
      subject: userId,
      expiresIn: '2 days',
    });
  }
}
