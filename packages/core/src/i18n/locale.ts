/**
 * Locale primitives shared by the client context and the server-side
 * `Accept-Language` resolver. No React, no browser globals.
 */

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function toSupportedLocale(value?: string | null): Locale | null {
  const normalized = value ? value.trim().toLowerCase().replace('_', '-') : '';
  if (!normalized) {
    return null;
  }
  const base = normalized.split('-')[0];
  return (
    SUPPORTED_LOCALES.find((locale) => locale === normalized) ??
    SUPPORTED_LOCALES.find((locale) => locale === base) ??
    null
  );
}
