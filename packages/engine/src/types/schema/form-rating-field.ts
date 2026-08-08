import type { IDeclarativeFormFieldBase } from './form-field-base';
import type { ILocalizedText } from './localized-text';

export type IDeclarativeFormRatingField = IDeclarativeFormFieldBase & {
  type: 'rating';
  min_label?: ILocalizedText;
  max_label?: ILocalizedText;
};
