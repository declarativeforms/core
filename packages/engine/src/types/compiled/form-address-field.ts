import type { ICompiledFormFieldBase } from './form-field-base';

export type ICompiledFormAddressField = ICompiledFormFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: 'string' | 'structured';
};
