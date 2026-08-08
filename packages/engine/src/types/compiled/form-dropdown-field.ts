import type { ICompiledFormFieldBase } from './form-field-base';
import type { ICompiledFormOption } from './form-option';

export type ICompiledFormDropdownField = ICompiledFormFieldBase & {
  type: 'dropdown';
  searchable?: boolean;
  options: ICompiledFormOption[];
};
