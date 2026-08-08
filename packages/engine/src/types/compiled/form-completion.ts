import type { ICompiledFormButton } from './form-button';

/**
 * The completion screen of a compiled form. When the author supplied a list of
 * rules, the one whose `when` matched the data has been selected, and its text
 * resolved to plain strings.
 */
export type ICompiledFormCompletion = {
  title?: string;
  message?: string;
  button?: ICompiledFormButton;
};
