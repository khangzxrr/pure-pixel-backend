import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaService } from './prisma.service';
import { UserService } from './services/user.service';


@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [UserService, AppService, PrismaService]
})
export class AppModule { }
