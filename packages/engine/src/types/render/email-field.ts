import type { IRenderableFieldBase } from './field-base';

export type IRenderableEmailField = IRenderableFieldBase & {
  type: 'email';
  min?: number;
  max?: number;
  otp: boolean;
};
