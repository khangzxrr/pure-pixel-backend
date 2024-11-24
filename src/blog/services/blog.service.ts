import { Inject, Injectable } from '@nestjs/common';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogRepository } from 'src/database/repositories/blog.repository';
import { BlogFindAllResponseDto } from '../dtos/rest/blog-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { BlogDto } from '../dtos/blog.dto';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { BlogPatchUpdateRequestDto } from '../dtos/rest/blog-patch-update.request.dto';
import { v4 } from 'uuid';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { Blog } from '@prisma/client';
import { BlogPutUpdateRequestDto } from '../dtos/rest/blog-put-update.request.dto';
import { BunnyService } from 'src/storage/services/bunny.service';

@Injectable()
export class BlogService {
  constructor(
    @Inject() private readonly blogRepository: BlogRepository,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly bunnyService: BunnyService,
  ) {}

  async signBlogThumbnail(blog: Blog) {
    const blogDto = plainToInstance(BlogDto, blog);

    blogDto.thumbnail = this.bunnyService.getPresignedFile(blog.thumbnail);

    return blogDto;
  }

  async findById(id: string) {
    const blog = await this.blogRepository.findByIdOrThrow(id);

    return this.signBlogThumbnail(blog);
  }

  async findAll(blogFindAllRequest: BlogFindAllRequestDto) {
    const count = await this.blogRepository.count(blogFindAllRequest.toWhere());

    const blogs = await this.blogRepository.findAll({
      skip: blogFindAllRequest.toSkip(),
      take: blogFindAllRequest.limit,
      where: blogFindAllRequest.toWhere(),
      orderBy: blogFindAllRequest.toOrderBy(),
    });

    const signedBlogDtoPromises = blogs.map((b) => this.signBlogThumbnail(b));

    const blogDtos = await Promise.all(signedBlogDtoPromises);

    return new BlogFindAllResponseDto(
      blogFindAllRequest.limit,
      count,
      blogDtos,
    );
  }

  async delete(id: string) {
    const blog = await this.blogRepository.findByIdOrThrow(id);

    await this.bunnyService.delete(blog.thumbnail);

    await this.blogRepository.deleteById(id);

    return true;
  }

  async replace(id: string, blogUpdateRequestDto: BlogPutUpdateRequestDto) {
    await this.blogRepository.findByIdOrThrow(id);

    const blog = await this.blogRepository.updateById(id, {
      title: blogUpdateRequestDto.title,
      content: blogUpdateRequestDto.content,
      status: blogUpdateRequestDto.status,
    });

    await this.bunnyService.uploadFromBuffer(
      blog.thumbnail,
      blogUpdateRequestDto.thumbnailFile.buffer,
    );

    return await this.signBlogThumbnail(blog);
  }

  async update(id: string, blogUpdateRequestDto: BlogPatchUpdateRequestDto) {
    await this.blogRepository.findByIdOrThrow(id);

    const blog = await this.blogRepository.updateById(id, {
      title: blogUpdateRequestDto.title,
      content: blogUpdateRequestDto.content,
      status: blogUpdateRequestDto.status,
    });

    if (blogUpdateRequestDto.thumbnailFile) {
      await this.bunnyService.uploadFromBuffer(
        blog.thumbnail,
        blogUpdateRequestDto.thumbnailFile.buffer,
      );
    }

    return await this.signBlogThumbnail(blog);
  }

  async create(userId: string, blogCreateRequestDto: BlogCreateRequestDto) {
    const blogId = v4();

    const thumbnailKey = `blog_thumbnail/${blogId}.${blogCreateRequestDto.thumbnailFile.extension}`;

    const sharp = await this.photoProcessService.sharpInitFromBuffer(
      blogCreateRequestDto.thumbnailFile.buffer,
    );
    const thumbnailBuffer = await this.photoProcessService
      .makeThumbnail(sharp)
      .then((s) => s.toBuffer());

    await this.bunnyService.uploadFromBuffer(thumbnailKey, thumbnailBuffer);

    const blog = await this.blogRepository.create({
      id: blogId,
      content: blogCreateRequestDto.content,
      title: blogCreateRequestDto.title,
      status: 'ENABLED',
      thumbnail: thumbnailKey,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return await this.signBlogThumbnail(blog);
  }
}
