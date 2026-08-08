import type { IDeclarativeFormFieldBase } from './form-field-base';

export type IDeclarativeFormCameraField = IDeclarativeFormFieldBase & {
  type: 'camera';
  facing_mode?: 'front' | 'rear';
};
