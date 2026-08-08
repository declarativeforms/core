import type { IDeclarativeFormFieldBase } from './form-field-base';
import type { IDeclarativeFormOption } from './form-option';

export type IDeclarativeFormSelectField = IDeclarativeFormFieldBase & {
  type: 'single_select' | 'multiple_select';
  options?: Array<IDeclarativeFormOption>;
  allow_other?: boolean;
};
