import type { IRenderableFieldBase } from './field-base';

/** A signature pad. The captured drawing is uploaded; the value is a URL. */
export type IRenderableSignatureField = IRenderableFieldBase & {
  type: 'signature';
};
