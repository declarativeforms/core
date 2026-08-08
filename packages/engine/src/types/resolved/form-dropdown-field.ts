import type { IResolvedFormFieldBase } from './form-field-base';
import type { IResolvedFormOption } from './form-option';

export type IResolvedFormDropdownField = IResolvedFormFieldBase & {
  type: 'dropdown';
  searchable?: boolean;
  options?: Array<IResolvedFormOption>;
};
