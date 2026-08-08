/**
 * A choice for a select, multiple-select, or dropdown field, with localized
 * text already resolved to a plain string.
 *
 * A bare string is shorthand for an option whose label and value are equal.
 */
export type IResolvedFormOption =
  | string
  | {
      label?: string;
      value?: string;
    };
