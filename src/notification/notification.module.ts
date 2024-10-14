import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationConsumer } from './consumers/notification.consumer';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { DatabaseModule } from 'src/database/database.module';
import { QueueModule } from 'src/queue/queue.module';
import { AuthenModule } from 'src/authen/authen.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    AuthenModule,
    StorageModule,
    QueueModule,
    DatabaseModule,
    MailerModule.forRoot({
      transport: `smtps://${process.env.SMTP_USERNAME}:${process.env.SMTP_PASSWORD}@${process.env.SMTP_SERVER}`,
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>',
      },
      template: {
        dir: __dirname + '/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [NotificationService, NotificationConsumer],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
