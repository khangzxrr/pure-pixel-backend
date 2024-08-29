import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { StorageModule } from './storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthenModule } from './authen/authen.module';
import {
  AuthGuard,
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
} from 'nest-keycloak-connect';
import { KeycloakConfigService } from './authen/services/keycloak-config.service';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [AuthenModule],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
  ],
})
export class AppModule {}
