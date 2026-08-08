import type { IResolvedFormButton } from './form-button';

/** The screen shown once a form is completed, with text resolved to strings. */
export type IResolvedFormCompletion = {
  title?: string;
  message?: string;
  button?: IResolvedFormButton;
};
