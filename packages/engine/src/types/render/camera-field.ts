import type { IRenderableFieldBase } from './field-base';

export type IRenderableCameraField = IRenderableFieldBase & {
  type: 'camera';
  facingMode: 'front' | 'rear';
};
