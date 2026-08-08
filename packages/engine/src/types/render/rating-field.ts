import type { IRenderableFieldBase } from './field-base';

/**
 * A rating scale. `min`/`max` are interpreted as the endpoints of the scale
 * (defaulting to 1 and 5 when absent); `minLabel`/`maxLabel` are optional
 * captions at the ends of the scale.
 */
export type IRenderableRatingField = IRenderableFieldBase & {
  type: 'rating';
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
};
