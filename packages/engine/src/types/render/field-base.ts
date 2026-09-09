import type { ICompiledValidationRule } from '../compiled';

export type IRenderableFieldBase = {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  visibleWhen?: string;
  validation: Array<ICompiledValidationRule>;
};
