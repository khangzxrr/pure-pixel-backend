import { Category } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { ApplicationEntity } from 'src/infrastructure/entities/application.entity';

export class CategoryEntity
  extends ApplicationEntity<CategoryEntity>
  implements Category
{
  id: string;
  name: string;
  description: string;
  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
}
