import type { IDeclarativeFormField } from './form-field';
import type { IDeclarativeFormNextRule } from './form-next-rule';
import type { ILocalizedText } from './localized-text';

export type IDeclarativeFormSection = {
  id?: string;
  title?: ILocalizedText;
  fields?: Array<IDeclarativeFormField>;
  next?: string | Array<IDeclarativeFormNextRule>;
};
