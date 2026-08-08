import type { IResolvedFormFieldBase } from './form-field-base';
import type { IResolvedFormOption } from './form-option';

export type IResolvedFormSelectField = IResolvedFormFieldBase & {
  type: 'single_select' | 'multiple_select';
  options?: Array<IResolvedFormOption>;
  allow_other?: boolean;
};
