import type { ICompiledFormOption } from '../compiled';
import type { IRenderableFieldBase } from './field-base';

export type IRenderableSingleSelectField = IRenderableFieldBase & {
  type: 'single_select';
  options: Array<ICompiledFormOption>;
  allowOther: boolean;
};
