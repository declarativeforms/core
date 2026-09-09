import type { IRenderableFieldBase } from './field-base';

export type IRenderableHiddenField = IRenderableFieldBase & {
  type: 'hidden';
};
