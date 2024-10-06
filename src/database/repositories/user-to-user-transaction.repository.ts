import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserToUserRepository {
  constructor(private readonly prisma: PrismaService) {}
}
