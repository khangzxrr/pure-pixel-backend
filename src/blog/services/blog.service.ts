import { Injectable } from '@nestjs/common';
import { BlogFindAllRequestDto } from '../dtos/rest/blog-find-all.request.dto';
import { BlogRepository } from 'src/database/repositories/blog.repository';
import { BlogFindAllResponseDto } from '../dtos/rest/blog-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { BlogDto } from '../dtos/blog.dto';
import { BlogCreateRequestDto } from '../dtos/rest/blog-create.request.dto';
import { BlogPatchUpdateRequestDto } from '../dtos/rest/blog-patch-update.request.dto';
import { BlogPutUpdateRequestDto } from '../dtos/rest/blog-put-update.request.dto';

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  async findAll(blogFindAllRequest: BlogFindAllRequestDto) {
    const count = await this.blogRepository.count(blogFindAllRequest.toWhere());

    const blogs = await this.blogRepository.findAll({
      skip: blogFindAllRequest.toSkip(),
      take: blogFindAllRequest.limit,
      where: blogFindAllRequest.toWhere(),
      orderBy: blogFindAllRequest.toOrderBy(),
    });

    const blogDtos = plainToInstance(BlogDto, blogs);

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
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return plainToInstance(BlogDto, blog);
  }
}
