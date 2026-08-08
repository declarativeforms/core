import type { DeclarativeFieldType } from './field-type';

/**
 * Field types that share the base shape and carry no extra properties.
 *
 * Derived from `DeclarativeFieldType` via `Extract` so this list stays in
 * lockstep with the canonical `DECLARATIVE_FIELD_TYPES` tuple (a typo here is a
 * compile error).
 */
export type IDeclarativeFormGenericFieldType = Extract<
  DeclarativeFieldType,
  | 'date'
  | 'date_month'
  | 'hidden'
  | 'long_text'
  | 'mobile_number'
  | 'number'
  | 'signature'
  | 'short_text'
  | 'time'
  | 'url'
>;
