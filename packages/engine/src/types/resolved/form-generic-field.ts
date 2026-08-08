import type { IDeclarativeFormGenericFieldType } from '../schema/form-generic-field-type';
import type { IResolvedFormFieldBase } from './form-field-base';

export type IResolvedFormGenericField = IResolvedFormFieldBase & {
  type: IDeclarativeFormGenericFieldType;
};
