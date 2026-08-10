import type { ICompiledFormOption } from '../compiled';
import type { IRenderableFieldBase } from './field-base';

/**
 * A multi-choice checkbox group. `min`/`max` are interpreted as how many
 * options may be chosen (`min` defaults to 0 when absent). `allowOther` adds a
 * free-text "other" option.
 */
export type IRenderableMultipleSelectField = IRenderableFieldBase & {
  type: 'multiple_select';
  options: ICompiledFormOption[];
  allowOther: boolean;
  min?: number;
  max?: number;
};
