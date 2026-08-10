import type { IRenderableFieldBase } from './field-base';

/**
 * A hidden field. Rendered as `<input type="hidden">` with no label or error
 * chrome; it still carries a value into the submission.
 */
export type IRenderableHiddenField = IRenderableFieldBase & {
  type: 'hidden';
};
