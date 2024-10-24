import { ApiProperty } from '@nestjs/swagger';
import { Comment as PrismaCommentEntity } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/user/entities/user.entity';

export class CommentEntity implements PrismaCommentEntity {
  @ApiProperty()
  id: string;

  @Exclude()
  photoId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  userId: string | null;

  @ApiProperty()
  parentId: string;

  @ApiProperty({ required: false, type: UserEntity })
  user?: UserEntity;

  constructor({ user, ...data }: Partial<CommentEntity>) {
    Object.assign(this, data);

    if (user) {
      this.user = new UserEntity(user);
    }
  }
}
