import { interpolateTemplate } from '@declarativeforms/core';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './locales';
import {
  enMessages,
  type TranslationKey,
  type TranslationMessages,
} from './messages/en';
import { esMessages } from './messages/es';

export const TRANSLATIONS: Record<Locale, TranslationMessages> = {
  en: enMessages,
  es: esMessages,
};

export type TranslationValues = Record<string, string | number>;

function normalizeLocaleCandidate(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value.trim().toLowerCase().replace('_', '-');
}

function toSupportedLocale(value?: string | null): Locale | null {
  const normalized = normalizeLocaleCandidate(value);
  if (!normalized) {
    return null;
  }

  const exact = SUPPORTED_LOCALES.find((locale) => locale === normalized);
  if (exact) {
    return exact;
  }

  const base = normalized.split('-')[0];
  return SUPPORTED_LOCALES.find((locale) => locale === base) ?? null;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  values?: TranslationValues,
): string {
  const template =
    TRANSLATIONS[locale][key] ?? TRANSLATIONS[DEFAULT_LOCALE][key];
  return interpolateTemplate(template ?? key, values ?? {});
}

export function resolveLocale(queryLang?: string | null): {
  locale: Locale;
  queryLocale: Locale | null;
} {
  const queryLocale = toSupportedLocale(queryLang);
  if (queryLocale) {
    return { locale: queryLocale, queryLocale };
  }

  const browserLocale =
    typeof navigator !== 'undefined'
      ? toSupportedLocale(navigator.language)
      : null;

  return {
    locale: browserLocale ?? DEFAULT_LOCALE,
    queryLocale: null,
  };
}
