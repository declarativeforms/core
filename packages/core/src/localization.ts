import type { ILocalizedText } from './definition';

function normalizeLocaleKey(locale: string): string {
  return locale.trim().toLowerCase().replace(/_/g, '-');
}

function getObjectLocalizedValue(
  input: Record<string, string>,
  locale: string,
): string | undefined {
  const normalizedLocale = normalizeLocaleKey(locale);

  const normalizedEntries = Object.entries(input).reduce(
    (acc, [key, value]) => {
      acc[normalizeLocaleKey(key)] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const baseLocale = normalizedLocale.split('-')[0];
  const candidates = [normalizedLocale, baseLocale, 'en'];

  for (const candidate of candidates) {
    const localizedValue = normalizedEntries[candidate];

    if (typeof localizedValue === 'string' && localizedValue.length > 0) {
      return localizedValue;
    }
  }

  for (const localizedValue of Object.values(normalizedEntries)) {
    if (typeof localizedValue === 'string' && localizedValue.length > 0) {
      return localizedValue;
    }
  }

  return undefined;
}

export function resolveLocalizedText(
  input: ILocalizedText | undefined,
  locale?: string,
): string {
  if (typeof input === 'string') {
    return input;
  }

  if (!input) {
    return '';
  }

  return getObjectLocalizedValue(input, locale ?? 'en') ?? '';
}
