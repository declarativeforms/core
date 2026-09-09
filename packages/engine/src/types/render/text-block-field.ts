import type { IRenderableFieldBase } from './field-base';

export type IRenderableTextBlockField = IRenderableFieldBase & {
  type: 'text_block';
  content: string;
};
