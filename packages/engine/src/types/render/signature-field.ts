import type { IRenderableFieldBase } from './field-base';

export type IRenderableSignatureField = IRenderableFieldBase & {
  type: 'signature';
};
