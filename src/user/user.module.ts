import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { MeController } from './controllers/me.controller';
import { AuthenModule } from 'src/authen/authen.module';

@Module({
  controllers: [UserController, MeController],
  imports: [AuthenModule],
})
export class UserModule {}
