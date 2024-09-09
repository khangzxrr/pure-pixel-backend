import { Transform, TransformFnParams } from 'class-transformer';

export function ToBoolean(): (target, key) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;

    if (typeof value == 'boolean') {
      return value;
    }

    if (value?.toString()?.toLowerCase() == 'true') {
      return true;
    }

    if (value?.toString()?.toLowerCase() == 'false') {
      return false;
    }

    return undefined;
  });
}
