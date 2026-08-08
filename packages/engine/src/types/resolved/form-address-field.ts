import type { IResolvedFormFieldBase } from './form-field-base';

export type IResolvedFormAddressField = IResolvedFormFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: 'string' | 'structured';
};
