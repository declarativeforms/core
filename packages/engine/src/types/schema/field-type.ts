export const DECLARATIVE_FIELD_TYPES = [
  'address',
  'address_country',
  'address_locality',
  'address_region',
  'camera',
  'date',
  'date_month',
  'dropdown',
  'email',
  'file_upload',
  'geolocation',
  'hidden',
  'long_text',
  'mobile_number',
  'multiple_select',
  'number',
  'rating',
  'short_text',
  'signature',
  'single_select',
  'time',
  'url',
] as const;

export type DeclarativeFieldType = (typeof DECLARATIVE_FIELD_TYPES)[number];

export function isDeclarativeFieldType(
  value: unknown,
): value is DeclarativeFieldType {
  return (
    typeof value === 'string' &&
    (DECLARATIVE_FIELD_TYPES as ReadonlyArray<string>).includes(value)
  );
}
