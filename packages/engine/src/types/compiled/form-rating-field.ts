import type { ICompiledFormFieldBase } from './form-field-base';

export type ICompiledFormRatingField = ICompiledFormFieldBase & {
  type: 'rating';
  min_label?: string;
  max_label?: string;
};
