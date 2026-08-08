import type { ICompiledFormFieldBase } from './form-field-base';

export type ICompiledFormCameraField = ICompiledFormFieldBase & {
  type: 'camera';
  facing_mode?: 'front' | 'rear';
};
