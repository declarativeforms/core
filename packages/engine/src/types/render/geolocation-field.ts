import type { IRenderableFieldBase } from './field-base';

/**
 * A geolocation capture. The stored value is `IRenderableGeolocationValue | null`.
 */
export type IRenderableGeolocationField = IRenderableFieldBase & {
  type: 'geolocation';
};
