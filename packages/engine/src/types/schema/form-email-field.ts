import type { IDeclarativeFormFieldBase } from './form-field-base';

export type IDeclarativeFormEmailField = IDeclarativeFormFieldBase & {
  type: 'email';
  block_free_email?: boolean;
  otp?: boolean;
};
