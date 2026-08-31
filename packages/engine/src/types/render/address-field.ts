import type { IRenderableFieldBase } from './field-base';

export type IRenderableAddressField = IRenderableFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat: 'string' | 'structured';
};
