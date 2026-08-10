import type { ICompiledFormOption } from '../compiled';
import type { IRenderableFieldBase } from './field-base';

/** A dropdown/select. `searchable` renders a filterable combobox. */
export type IRenderableDropdownField = IRenderableFieldBase & {
  type: 'dropdown';
  options: ICompiledFormOption[];
  searchable: boolean;
};
