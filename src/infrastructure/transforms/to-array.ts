import { Transform, TransformFnParams } from 'class-transformer';

export function ToArray(): (target, key) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;

    if (Array.isArray(value)) {
      return value;
    }

    return value.split(',');
  });
}
