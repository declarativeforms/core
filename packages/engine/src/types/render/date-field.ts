import type { IRenderableFieldBase } from './field-base';

export type IRenderableDateField = IRenderableFieldBase & {
  type: 'date' | 'date_month' | 'time';
  inputType: 'date' | 'month' | 'time';
  min?: string;
  max?: string;
};
