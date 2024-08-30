import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PhotographerDTO } from '../dtos/photographer.dto';

@Injectable()
export class PhotographerService {
  constructor(private readonly prisma: PrismaService) {}
  async getInfo(userId: string): Promise<PhotographerDTO> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
}
