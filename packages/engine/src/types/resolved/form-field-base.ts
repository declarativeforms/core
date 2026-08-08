import type { IResolvedFormValidator } from './form-validator';

/**
 * Properties shared by every field, with `label`/`placeholder` already resolved
 * to plain strings. Optionality matches the schema base (forgiving).
 */
export type IResolvedFormFieldBase = {
  id?: string;
  label?: string;
  placeholder?: string;
  validators?: Array<IResolvedFormValidator>;
  visible_when?: string;
};
