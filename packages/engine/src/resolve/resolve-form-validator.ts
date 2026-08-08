import type {
  IDeclarativeFormValidator,
  IResolvedFormValidator,
} from '../types';
import { resolveLocalizedText } from './localize';

/**
 * Localize a validator's message while preserving the authored DSL shape.
 * Normalization into compiled rules happens later, in `compile`.
 */
export function resolveFormValidator(
  validator: IDeclarativeFormValidator,
  locale: string,
): IResolvedFormValidator {
  if (validator === 'required') {
    return 'required';
  }

  const message =
    validator.message !== undefined
      ? { message: resolveLocalizedText(validator.message, locale) }
      : {};

  switch (validator.type) {
    case 'required':
      return { type: 'required', ...message };
    case 'pattern':
      return { type: 'pattern', regex: validator.regex, ...message };
    case 'min':
      return { type: 'min', value: validator.value, ...message };
    case 'max':
      return { type: 'max', value: validator.value, ...message };
    case 'min_length':
      return { type: 'min_length', value: validator.value, ...message };
    case 'max_length':
      return { type: 'max_length', value: validator.value, ...message };
    case 'expression':
      return { type: 'expression', expression: validator.expression, ...message };
  }
}
