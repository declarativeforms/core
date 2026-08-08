import type { IRenderableFieldBase } from './field-base';

/** A camera capture. `facingMode` selects the front or rear camera. */
export type IRenderableCameraField = IRenderableFieldBase & {
  type: 'camera';
  facingMode: 'front' | 'rear';
};
