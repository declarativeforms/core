/**
 * The canonical set of connection types a form may declare. Single source of
 * truth for `DeclarativeConnectionType` and the runtime guard.
 */
export const DECLARATIVE_CONNECTION_TYPES = ['email', 'webhook'] as const;

export type DeclarativeConnectionType =
  (typeof DECLARATIVE_CONNECTION_TYPES)[number];

export function isDeclarativeConnectionType(
  value: unknown,
): value is DeclarativeConnectionType {
  return (
    typeof value === 'string' &&
    (DECLARATIVE_CONNECTION_TYPES as readonly string[]).includes(value)
  );
}
