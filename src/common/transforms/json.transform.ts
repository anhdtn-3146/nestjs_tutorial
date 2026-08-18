import {
  ClassConstructor,
  plainToInstance,
  TransformFnParams,
} from 'class-transformer';

export function parseJsonValue({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function parseJsonArrayAs<T>(
  target: ClassConstructor<T>,
): (params: TransformFnParams) => unknown {
  return (params) => {
    const value = parseJsonValue(params);
    return Array.isArray(value) ? plainToInstance(target, value) : value;
  };
}
