import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { PhotographerModule } from './photographer/photographer.module';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakRoleGuard } from './authen/guards/KeycloakRoleGuard.guard';
import { AuthenModule } from './authen/authen.module';
import { AuthGuard } from 'nest-keycloak-connect';
import { DatabaseModule } from './database/database.module';
@Module({
  providers: [
    //must register AuthGuard, customRoleGuard sequence in order to get it to work
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: KeycloakRoleGuard,
    },
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
  ],
  controllers: [AppController],
})
export class AppModule {}
