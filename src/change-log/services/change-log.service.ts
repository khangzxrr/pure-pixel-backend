import { Inject, Injectable } from '@nestjs/common';
import { ChangeLog, ChangeLogStatus, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { ChangeLogRepository } from 'src/database/repositories/change-log.repository';
import { ChangeLogDto } from '../dtos/change-log.dto';
import { ChangeLogCreateRequestDto } from '../dtos/rest/change-log-create.request.dto';
import { ChangeLogFindAllRequestDto } from '../dtos/rest/change-log-find-all.request.dto';
import { ChangeLogFindAllResponseDto } from '../dtos/rest/change-log-find-all.response.dto';
import { ChangeLogPatchUpdateRequestDto } from '../dtos/rest/change-log-patch-update.request.dto';

@Injectable()
export class ChangeLogService {
  constructor(
    @Inject() private readonly changeLogRepository: ChangeLogRepository,
  ) {}

  //publishing stamps the current time, going back to draft clears it,
  //so re-publishing an entry shows the "new" badge again
  private resolvePublishedAt(status: ChangeLogStatus, current?: ChangeLog) {
    if (status === 'DRAFT') {
      return null;
    }

    if (current?.status === 'PUBLISHED') {
      return current.publishedAt;
    }

    return new Date();
  }

  async findPublished(findAllRequestDto: ChangeLogFindAllRequestDto) {
    const where: Prisma.ChangeLogWhereInput = {
      ...findAllRequestDto.toWhere(),
      status: 'PUBLISHED',
    };

    const count = await this.changeLogRepository.count(where);

    const changeLogs = await this.changeLogRepository.findAll({
      skip: findAllRequestDto.toSkip(),
      take: findAllRequestDto.limit,
      where,
      orderBy: {
        publishedAt: 'desc',
      },
    });

    return new ChangeLogFindAllResponseDto(
      findAllRequestDto.limit,
      count,
      plainToInstance(ChangeLogDto, changeLogs),
    );
  }

  async findLatestPublished() {
    const changeLog = await this.changeLogRepository.findFirst({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    return changeLog ? plainToInstance(ChangeLogDto, changeLog) : null;
  }

  async findAll(findAllRequestDto: ChangeLogFindAllRequestDto) {
    const where = findAllRequestDto.toWhere();

    const count = await this.changeLogRepository.count(where);

    const changeLogs = await this.changeLogRepository.findAll({
      skip: findAllRequestDto.toSkip(),
      take: findAllRequestDto.limit,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new ChangeLogFindAllResponseDto(
      findAllRequestDto.limit,
      count,
      plainToInstance(ChangeLogDto, changeLogs),
    );
  }

  async create(authorId: string, createRequestDto: ChangeLogCreateRequestDto) {
    const changeLog = await this.changeLogRepository.create({
      version: createRequestDto.version,
      title: createRequestDto.title,
      content: createRequestDto.content,
      status: createRequestDto.status,
      publishedAt: this.resolvePublishedAt(createRequestDto.status),
      authorId,
    });

    return plainToInstance(ChangeLogDto, changeLog);
  }

  async update(id: string, updateRequestDto: ChangeLogPatchUpdateRequestDto) {
    const current = await this.changeLogRepository.findByIdOrThrow(id);

    const changeLog = await this.changeLogRepository.updateById(id, {
      version: updateRequestDto.version,
      title: updateRequestDto.title,
      content: updateRequestDto.content,
      status: updateRequestDto.status,
      publishedAt: updateRequestDto.status
        ? this.resolvePublishedAt(updateRequestDto.status, current)
        : undefined,
    });

    return plainToInstance(ChangeLogDto, changeLog);
  }

  async delete(id: string) {
    await this.changeLogRepository.findByIdOrThrow(id);

    await this.changeLogRepository.deleteById(id);

    return true;
  }
}
