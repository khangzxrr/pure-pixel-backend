import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaService } from './prisma.service';
import { UserService } from './services/user.service';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
    }),
    AuthModule.forRoot({
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI: "http://localhost:3567",
      apiKey: process.env.SUPERTOKENS_API_KEYS,
      appInfo: {
        // Learn more about this on https://supertokens.com/docs/passwordless/appinfo
        appName: "PurePixel",
        apiDomain: "http://localhost:3000",
        websiteDomain: "http://localhost:3006",
        apiBasePath: "/auth",
        websiteBasePath: "/auth"
      },
    }),
    StorageModule,
  ],
  controllers: [AppController],
  providers: [UserService, AppService, PrismaService]
})
export class AppModule { }
