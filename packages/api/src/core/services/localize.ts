import type { ILocalizedText } from '../types';

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

  const normalizedLocale = (locale ?? 'en').trim().toLowerCase().replace('_', '-');
  const baseLocale = normalizedLocale.split('-')[0];
  const candidates = [normalizedLocale, baseLocale, 'en'];

  const normalizedEntries = Object.entries(input).reduce(
    (acc, [key, value]) => {
      acc[key.trim().toLowerCase().replace('_', '-')] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  for (const candidate of candidates) {
    const value = normalizedEntries[candidate];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  for (const value of Object.values(normalizedEntries)) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return '';
}
