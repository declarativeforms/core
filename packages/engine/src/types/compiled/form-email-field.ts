import type { ICompiledFormFieldBase } from './form-field-base';

export type ICompiledFormEmailField = ICompiledFormFieldBase & {
  type: 'email';
  block_free_email?: boolean;
  otp?: boolean;
};
