import { FileSystemStoredFile } from 'nestjs-form-data';

export class TemporaryBookingPhotoUpload {
  bookingId: string;
  photographerId: string;
  file: FileSystemStoredFile;
}
