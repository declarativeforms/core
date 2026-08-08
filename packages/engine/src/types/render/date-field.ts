import type { IRenderableFieldBase } from './field-base';

/**
 * A date, month, or time input. `min`/`max` are the native control bounds as
 * ISO strings (e.g. `2026-01-01`, `2026-01`, `09:00`).
 */
export type IRenderableDateField = IRenderableFieldBase & {
  type: 'date' | 'date_month' | 'time';
  inputType: 'date' | 'month' | 'time';
  min?: string;
  max?: string;
};
