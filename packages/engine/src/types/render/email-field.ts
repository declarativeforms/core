import type { IRenderableFieldBase } from './field-base';

/** An email input. `min`/`max` are the allowed character-length range. */
export type IRenderableEmailField = IRenderableFieldBase & {
  type: 'email';
  min?: number;
  max?: number;
};
