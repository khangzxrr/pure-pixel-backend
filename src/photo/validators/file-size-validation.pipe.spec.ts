import { PhotoValidationPipe } from './file-size-validation.pipe';
import { PhotoConstant } from '../constants/photo.constant';

describe('PhotoValidationPipe', () => {
  const pipe = new PhotoValidationPipe();

  it('returns true when file size is below the minimum photo size', () => {
    expect(
      pipe.transform(
        { size: PhotoConstant.MIN_PHOTO_SIZE - 1 },
        { type: 'body' },
      ),
    ).toBe(true);
  });

  it('returns false when file size reaches the minimum photo size', () => {
    expect(
      pipe.transform({ size: PhotoConstant.MIN_PHOTO_SIZE }, { type: 'body' }),
    ).toBe(false);
  });
});
