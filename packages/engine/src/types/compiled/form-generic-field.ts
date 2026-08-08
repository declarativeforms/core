import type { IDeclarativeFormGenericFieldType } from '../schema/form-generic-field-type';
import type { ICompiledFormFieldBase } from './form-field-base';

export type ICompiledFormGenericField = ICompiledFormFieldBase & {
  type: IDeclarativeFormGenericFieldType;
};
