import type { IDeclarativeFormButton } from './form-button';
import type { ILocalizedText } from './localized-text';

/** The screen shown once a form is completed. */
export type IDeclarativeFormCompletion = {
  title?: ILocalizedText;
  message?: ILocalizedText;
  button?: IDeclarativeFormButton;
};
