import { Module, Provider } from '@nestjs/common';
import { FindUsersController } from './queries/find-users/find-users.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { FindUsersQueryHandler } from './queries/find-users/find-users.query-handler';
import { PrismaService } from 'src/prisma.service';

const queryHandlers: Provider[] = [FindUsersQueryHandler];

@Module({
  imports: [CqrsModule],
  providers: [...queryHandlers],
  controllers: [FindUsersController]
})
export class UserModule { }
