import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { BlogService } from './services/blog.service';
import { BlogController } from './controllers/blog.controller';
import { AuthenModule } from 'src/authen/authen.module';
import { PhotoModule } from 'src/photo/photo.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AuthenModule,
    PhotoModule,
    NestjsFormDataModule,
  ],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
