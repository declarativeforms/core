import type { IDeclarativeFormFieldBase } from './form-field-base';
import type { IDeclarativeFormGenericFieldType } from './form-generic-field-type';

export type IDeclarativeFormGenericField = IDeclarativeFormFieldBase & {
  type: IDeclarativeFormGenericFieldType;
};
