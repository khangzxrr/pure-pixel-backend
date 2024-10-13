import { Inject, Injectable } from '@nestjs/common';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogRepository } from 'src/database/repositories/blog.repository';
import { BlogFindAllResponseDto } from '../dtos/rest/blog-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { BlogDto } from '../dtos/blog.dto';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { BlogPatchUpdateRequestDto } from '../dtos/rest/blog-patch-update.request.dto';
import { BlogPutUpdateRequestDto } from '../dtos/rest/blog-put-update.request.dto';
import { StorageService } from 'src/storage/services/storage.service';
import { BlogCreatePresignedUploadThumbnailDto } from '../dtos/rest/blog-create-presigned-upload-thumbnail.response.dto';

@Injectable()
export class BlogService {
  constructor(
    @Inject() private readonly blogRepository: BlogRepository,
    @Inject() private readonly storageService: StorageService,
  ) {}

  async findAll(blogFindAllRequest: BlogFindAllRequestDto) {
    const count = await this.blogRepository.count(blogFindAllRequest.toWhere());

    const blogs = await this.blogRepository.findAll({
      skip: blogFindAllRequest.toSkip(),
      take: blogFindAllRequest.limit,
      where: blogFindAllRequest.toWhere(),
      orderBy: blogFindAllRequest.toOrderBy(),
    });

    const blogDtoPromises = plainToInstance(BlogDto, blogs).map(async (b) => {
      if (b.thumbnail.length > 0) {
        b.thumbnail = await this.storageService.signUrlUsingCDN(b.thumbnail);
      }

      return b;
    });

    const blogDtos = await Promise.all(blogDtoPromises);

    return new BlogFindAllResponseDto(
      blogFindAllRequest.limit,
      count,
      blogDtos,
    );
  }

  async delete(id: string) {
    await this.blogRepository.findByIdOrThrow(id);

    await this.blogRepository.deleteById(id);

    return 'deleted';
  }

  async createPresignedUploadThumbnail(id: string) {
    await this.blogRepository.findByIdOrThrow(id);

    const key = `blog_thumbnail/${id}.jpg`;
    const presignedUploadUrl =
      await this.storageService.getPresignedUploadUrl(key);

    await this.blogRepository.updateById(id, {
      thumbnail: key,
    });

    return new BlogCreatePresignedUploadThumbnailDto(presignedUploadUrl);
  }

  async replace(id: string, blogPutUpdateRequestDto: BlogPutUpdateRequestDto) {
    await this.blogRepository.findByIdOrThrow(id);

    const blog = await this.blogRepository.updateById(
      id,
      blogPutUpdateRequestDto,
    );

    return plainToInstance(BlogDto, blog);
  }

  async update(id: string, blogUpdateRequestDto: BlogPatchUpdateRequestDto) {
    await this.blogRepository.findByIdOrThrow(id);

    const blog = await this.blogRepository.updateById(id, blogUpdateRequestDto);

    return plainToInstance(BlogDto, blog);
  }

  async create(userId: string, blogCreateRequestDto: BlogCreateRequestDto) {
    const blog = await this.blogRepository.create({
      ...blogCreateRequestDto,
      thumbnail: '',
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return plainToInstance(BlogDto, blog);
  }
}
