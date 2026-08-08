import type { IResolvedFormFieldBase } from './form-field-base';

export type IResolvedFormRatingField = IResolvedFormFieldBase & {
  type: 'rating';
  min_label?: string;
  max_label?: string;
};
