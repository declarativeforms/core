import type { DeclarativeFieldType } from './field-type';

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
