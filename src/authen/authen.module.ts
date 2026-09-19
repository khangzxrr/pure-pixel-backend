import { Global, Module } from '@nestjs/common';
import { CachingModule } from 'src/caching/caching.module';
import { CustomConfigModule } from 'src/customConfig/custom-config.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaService } from 'src/prisma.service';
import { RoleGuard } from './guards/role.guard';
import WebsocketAuthGuard from './guards/ws.auth.guard';
import { AuthGuard, TokenVerifier } from './oidc';
import { IdentityService } from './services/identity.service';

@Global()
@Module({
  providers: [
    IdentityService,
    TokenVerifier,
    AuthGuard,
    RoleGuard,
    WebsocketAuthGuard,
    PrismaService,
  ],
  exports: [
    IdentityService,
    TokenVerifier,
    AuthGuard,
    RoleGuard,
    WebsocketAuthGuard,
  ],
  imports: [CustomConfigModule, CachingModule, DatabaseModule, StorageModule],
})
export class AuthenModule {}
