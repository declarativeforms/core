import type { IDeclarativeFormFieldBase } from './form-field-base';
import type { IDeclarativeFormOption } from './form-option';

export type IDeclarativeFormDropdownField = IDeclarativeFormFieldBase & {
  type: 'dropdown';
  searchable?: boolean;
  options?: Array<IDeclarativeFormOption>;
};
