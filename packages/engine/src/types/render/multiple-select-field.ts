import type { ICompiledFormOption } from '../compiled';
import type { IRenderableFieldBase } from './field-base';

export type IRenderableMultipleSelectField = IRenderableFieldBase & {
  type: 'multiple_select';
  options: Array<ICompiledFormOption>;
  allowOther: boolean;
  min?: number;
  max?: number;
};
