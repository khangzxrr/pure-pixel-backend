import { Inject, Injectable } from '@nestjs/common';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogRepository } from 'src/database/repositories/blog.repository';
import { BlogFindAllResponseDto } from '../dtos/rest/blog-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { BlogDto } from '../dtos/blog.dto';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { BlogPatchUpdateRequestDto } from '../dtos/rest/blog-patch-update.request.dto';
import { StorageService } from 'src/storage/services/storage.service';
import { v4 } from 'uuid';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { Blog } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(
    @Inject() private readonly blogRepository: BlogRepository,
    @Inject() private readonly storageService: StorageService,
    @Inject() private readonly photoProcessService: PhotoProcessService,
  ) {}

  async signBlogThumbnail(blog: Blog) {
    const blogDto = plainToInstance(BlogDto, blog);

    blogDto.thumbnail = await this.storageService.signUrlUsingCDN(
      blog.thumbnail,
    );

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
    await this.blogRepository.findByIdOrThrow(id);

    const deletedBlog = await this.blogRepository.deleteById(id);

    await this.storageService.deleteKeys([deletedBlog.thumbnail]);

    return 'deleted';
  }

  async update(id: string, blogUpdateRequestDto: BlogPatchUpdateRequestDto) {
    await this.blogRepository.findByIdOrThrow(id);

    const blog = await this.blogRepository.updateById(id, blogUpdateRequestDto);

    return plainToInstance(BlogDto, blog);
  }

  async updateThumbnail(id: string, thumbnailFile: Express.Multer.File) {
    await this.blogRepository.findByIdOrThrow(id);

    let extension = 'jpg';
    const splitByDot = thumbnailFile.originalname.split('.');
    if (splitByDot.length > 0) {
      extension = splitByDot[splitByDot.length - 1];
    }

    const thumbnailPath = `blog_thumbnail/${id}.${extension}`;

    const sharp = await this.photoProcessService.sharpInitFromBuffer(
      thumbnailFile.buffer,
    );
    const thumbnailBuffer = await this.photoProcessService
      .makeThumbnail(sharp)
      .then((s) => s.toBuffer());

    await this.storageService.uploadFromBytes(thumbnailPath, thumbnailBuffer);
  }

  async create(
    userId: string,
    blogCreateRequestDto: BlogCreateRequestDto,
    thumbnailFile: Express.Multer.File,
  ) {
    const blogId = v4();

    let extension = 'jpg';
    const splitByDot = thumbnailFile.originalname.split('.');
    if (splitByDot.length > 0) {
      extension = splitByDot[splitByDot.length - 1];
    }

    const thumbnailPath = `blog_thumbnail/${blogId}.${extension}`;

    const sharp = await this.photoProcessService.sharpInitFromBuffer(
      thumbnailFile.buffer,
    );
    const thumbnailBuffer = await this.photoProcessService
      .makeThumbnail(sharp)
      .then((s) => s.toBuffer());

    await this.storageService.uploadFromBytes(thumbnailPath, thumbnailBuffer);

    const blog = await this.blogRepository.create({
      id: blogId,
      content: blogCreateRequestDto.content,
      title: blogCreateRequestDto.title,
      status: 'ENABLED',
      thumbnail: thumbnailPath,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return plainToInstance(BlogDto, blog);
  }
}
