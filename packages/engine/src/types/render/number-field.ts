import type { IRenderableFieldBase } from './field-base';

/** A numeric input. `integer` means only whole numbers are accepted. */
export type IRenderableNumberField = IRenderableFieldBase & {
  type: 'number';
  min?: number;
  max?: number;
  integer: boolean;
};
