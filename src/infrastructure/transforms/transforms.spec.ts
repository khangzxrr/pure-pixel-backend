import { plainToInstance } from 'class-transformer';
import { ToArray } from './to-array';
import { ToBoolean } from './to-boolean';

class TransformTarget {
  @ToArray()
  items?: string[];

  @ToBoolean()
  flag?: boolean;
}

describe('transforms', () => {
  describe('ToArray', () => {
    it('should keep arrays as they are', () => {
      expect(
        plainToInstance(TransformTarget, { items: ['a', 'b'] }).items,
      ).toEqual(['a', 'b']);
    });

    it('should split comma separated strings', () => {
      expect(
        plainToInstance(TransformTarget, { items: 'a,b,c' }).items,
      ).toEqual(['a', 'b', 'c']);
    });
  });

  describe('ToBoolean', () => {
    it.each([
      [true, true],
      [false, false],
      ['true', true],
      ['TRUE', true],
      ['false', false],
      ['False', false],
      ['yes', undefined],
      [1, undefined],
      [null, undefined],
    ])('should transform %p to %p', (input, expected) => {
      expect(plainToInstance(TransformTarget, { flag: input }).flag).toBe(
        expected,
      );
    });
  });
});
