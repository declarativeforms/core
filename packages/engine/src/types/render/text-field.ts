import type { IRenderableFieldBase } from './field-base';

export type IRenderableTextField = IRenderableFieldBase & {
  type: 'short_text' | 'url' | 'mobile_number';
  inputType: 'text' | 'url' | 'tel';
  min?: number;
  max?: number;
};
