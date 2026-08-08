import type { ILocalizedText } from './localized-text';

/**
 * A validation rule attached to a field.
 *
 * The bare string `'required'` is shorthand for `{ type: 'required' }`. Every
 * object variant carries a required `type` discriminant so the union narrows
 * cleanly, and each rule requires the payload it structurally depends on
 * (`regex`, `value`, or `expression`).
 */
export type IDeclarativeFormValidator =
  | 'required'
  | { type: 'required'; message?: ILocalizedText }
  | { type: 'pattern'; regex: string; message?: ILocalizedText }
  | { type: 'min'; value: number | string; message?: ILocalizedText }
  | { type: 'max'; value: number | string; message?: ILocalizedText }
  | { type: 'min_length'; value: number; message?: ILocalizedText }
  | { type: 'max_length'; value: number; message?: ILocalizedText }
  | { type: 'expression'; expression: string; message?: ILocalizedText };
