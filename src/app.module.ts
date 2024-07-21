import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaService } from './prisma.service';
import { UserService } from './services/user.service';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    CacheModule.register(),
    AuthModule.forRoot({
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI: "https://try.supertokens.com",
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
  ],
  controllers: [AppController],
  providers: [UserService, AppService, PrismaService]
})
export class AppModule { }
