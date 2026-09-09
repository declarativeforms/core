import type { IRenderableFieldBase } from './field-base';

export type IRenderableGeolocationField = IRenderableFieldBase & {
  type: 'geolocation';
};
