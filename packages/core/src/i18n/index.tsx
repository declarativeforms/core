import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { interpolateTemplate } from '@declarativeforms/engine';

import {
  enMessages,
  type TranslationKey,
  type TranslationMessages,
} from './messages/en';
import { esMessages } from './messages/es';

export * from './messages/en';

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export type TranslationValues = Record<string, string | number>;
type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const TRANSLATIONS: Record<Locale, TranslationMessages> = {
  en: enMessages,
  es: esMessages,
};

function toSupportedLocale(value?: string | null): Locale | null {
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

function translate(
  locale: Locale,
  key: TranslationKey,
  values?: TranslationValues,
): string {
  const template =
    TRANSLATIONS[locale][key] ?? TRANSLATIONS[DEFAULT_LOCALE][key];
  return interpolateTemplate(template ?? key, values ?? {});
}

function resolveLocale(queryLang?: string | null): {
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
  return { locale: browserLocale ?? DEFAULT_LOCALE, queryLocale: null };
}

type I18nContextValue = {
  locale: Locale;
  t: Translate;
  withLang: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export function I18nProvider(props: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const { locale, queryLocale } = resolveLocale(searchParams.get('lang'));

  const value: I18nContextValue = {
    locale,
    t: (key, values) => translate(locale, key, values),
    withLang: (path) => {
      if (!queryLocale) {
        return path;
      }
      const url = new URL(path, window.location.origin);
      url.searchParams.set('lang', queryLocale);
      return `${url.pathname}${url.search}${url.hash}`;
    },
  };

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  );
}

/**
 * Keep the URL's `?lang` in step with the form's declared locale, so a shared
 * link carries the language the form was authored in. No-op until the form has
 * loaded or when the param already matches.
 */
export function useSyncLangParam(formLocale: string | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!formLocale || searchParams.get('lang') === formLocale) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('lang', formLocale);
    setSearchParams(next, { replace: true });
  }, [formLocale, searchParams, setSearchParams]);
}
