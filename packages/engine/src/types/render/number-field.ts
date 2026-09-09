import type { IRenderableFieldBase } from './field-base';

export type IRenderableNumberField = IRenderableFieldBase & {
  type: 'number';
  min?: number;
  max?: number;
  integer: boolean;
};
