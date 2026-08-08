import type { ICompiledFormOption } from '../compiled/form-option';
import type { IRenderableFieldBase } from './field-base';

/** A single-choice radio group. `allowOther` adds a free-text "other" option. */
export type IRenderableSingleSelectField = IRenderableFieldBase & {
  type: 'single_select';
  options: ICompiledFormOption[];
  allowOther: boolean;
};
