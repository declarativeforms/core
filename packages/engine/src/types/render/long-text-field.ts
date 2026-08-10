import type { IRenderableFieldBase } from './field-base';

/**
 * A multi-line textarea.
 * `min`/`max` are interpreted as the allowed character-length range.
 */
export type IRenderableLongTextField = IRenderableFieldBase & {
  type: 'long_text';
  min?: number;
  max?: number;
};
