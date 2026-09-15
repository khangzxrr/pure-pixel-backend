import { Transform, TransformFnParams } from 'class-transformer';

export function ToArray(): PropertyDecorator {
  return Transform((params: TransformFnParams) => {
    const { value } = params;

    if (Array.isArray(value)) {
      return value;
    }

    return value.split(',');
  });
}
