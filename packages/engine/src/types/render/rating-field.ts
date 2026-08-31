import type { IRenderableFieldBase } from './field-base';

export type IRenderableRatingField = IRenderableFieldBase & {
  type: 'rating';
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
};
