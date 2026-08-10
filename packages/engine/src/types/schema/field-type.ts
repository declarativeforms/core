/**
 * The canonical set of field types a form may declare.
 *
 * This tuple is the single source of truth: `DeclarativeFieldType`, the runtime
 * guard, and `IDeclarativeFormGenericFieldType` all derive from it, so the type
 * list can never drift from a hand-copied duplicate.
 */
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
    (DECLARATIVE_FIELD_TYPES as readonly string[]).includes(value)
  );
}
