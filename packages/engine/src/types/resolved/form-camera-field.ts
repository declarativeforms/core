import type { IResolvedFormFieldBase } from './form-field-base';

export type IResolvedFormCameraField = IResolvedFormFieldBase & {
  type: 'camera';
  facing_mode?: 'front' | 'rear';
};
