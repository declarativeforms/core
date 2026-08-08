import type { IDeclarativeFormFieldBase } from './form-field-base';

export type IDeclarativeFormAddressField = IDeclarativeFormFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: 'string' | 'structured';
};
