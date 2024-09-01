import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { PhotographerModule } from './photographer/photographer.module';
import { AuthenModule } from './authen/authen.module';
import { DatabaseModule } from './database/database.module';
import { PhotoModule } from './photo/photo.module';
@Module({
  providers: [
    //must register AuthGuard, customRoleGuard sequence in order to get it to work
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule,
    AuthenModule,
    UserModule,
    PhotographerModule,
    DatabaseModule,
    PhotoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
