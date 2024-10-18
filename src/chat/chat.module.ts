import { Module } from '@nestjs/common';
import { AuthenModule } from 'src/authen/authen.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';

@Module({
  imports: [DatabaseModule, AuthenModule, StorageModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
