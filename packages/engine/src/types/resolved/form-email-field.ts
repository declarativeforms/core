import type { IResolvedFormFieldBase } from './form-field-base';

export type IResolvedFormEmailField = IResolvedFormFieldBase & {
  type: 'email';
  block_free_email?: boolean;
  otp?: boolean;
};
