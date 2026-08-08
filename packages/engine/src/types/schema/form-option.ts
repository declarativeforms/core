import type { ILocalizedText } from './localized-text';

/**
 * A choice for a select, multiple-select, or dropdown field.
 *
 * A bare string is shorthand for an option whose label and value are equal.
 */
export type IDeclarativeFormOption =
  | string
  | {
      label?: ILocalizedText;
      value?: string;
    };
