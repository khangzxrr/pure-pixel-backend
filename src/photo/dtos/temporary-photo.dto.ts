import { FileSystemStoredFile } from 'nestjs-form-data';

export class TemporaryPhotoDto {
  photoId: string;
  file: FileSystemStoredFile;
}
