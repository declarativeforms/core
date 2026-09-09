import type { ICompiledFormOption } from '../compiled';
import type { IRenderableFieldBase } from './field-base';

export type IRenderableDropdownField = IRenderableFieldBase & {
  type: 'dropdown';
  options: Array<ICompiledFormOption>;
  searchable: boolean;
};
