import type { IRenderableFieldBase } from './field-base';

export type IRenderableLongTextField = IRenderableFieldBase & {
  type: 'long_text';
  min?: number;
  max?: number;
};
