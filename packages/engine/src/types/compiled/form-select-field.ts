import type { ICompiledFormFieldBase } from './form-field-base';
import type { ICompiledFormOption } from './form-option';

export type ICompiledFormSelectField = ICompiledFormFieldBase & {
  type: 'single_select' | 'multiple_select';
  options: ICompiledFormOption[];
  allow_other?: boolean;
};
