import type { IRenderableFieldBase } from './field-base';

/**
 * An address autocomplete. The `type` selects the granularity (full address,
 * locality, region, or country); `outputFormat` chooses a formatted string or
 * a structured object.
 */
export type IRenderableAddressField = IRenderableFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat: 'string' | 'structured';
};
