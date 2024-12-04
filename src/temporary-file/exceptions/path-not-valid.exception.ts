import { BadRequestException } from '@nestjs/common';

export class PathNotValidException extends BadRequestException {
  constructor() {
    super(PathNotValidException.name);
  }
}
