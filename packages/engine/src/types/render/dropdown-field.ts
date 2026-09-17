import type { ICompiledFormOption } from '../compiled';
import type { IRenderableFieldBase } from './field-base';

export type IRenderableDropdownField = IRenderableFieldBase & {
  type: 'dropdown';
  options: Array<ICompiledFormOption>;
  dependsOn?: string;
  optionsByParent: Record<string, Array<ICompiledFormOption>>;
  searchable: boolean;
};
