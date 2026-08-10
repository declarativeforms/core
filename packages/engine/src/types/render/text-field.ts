import type { IRenderableFieldBase } from './field-base';

/**
 * A single-line text input (plain text, URL, or phone number).
 * `min`/`max` are interpreted as the allowed character-length range.
 */
export type IRenderableTextField = IRenderableFieldBase & {
  type: 'short_text' | 'url' | 'mobile_number';
  inputType: 'text' | 'url' | 'tel';
  min?: number;
  max?: number;
};
