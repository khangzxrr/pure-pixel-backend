import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PhotographerDTO } from '../dtos/photographer.dto';
import { StorageService } from 'src/storage/services/storage.service';

@Injectable()
export class PhotographerService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}
  async getInfo(userId: string): Promise<PhotographerDTO> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
}
