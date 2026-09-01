'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

import { interpolateTemplate } from '@declarativeforms/engine';

import { replaceSearchParams } from '@/lib/url-state';
import { DEFAULT_LOCALE, toSupportedLocale, type Locale } from './locale';
import {
  enMessages,
  type TranslationKey,
  type TranslationMessages,
} from './messages/en';
import { esMessages } from './messages/es';

export * from './messages/en';
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from './locale';

export type TranslationValues = Record<string, string | number>;
type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const TRANSLATIONS: Record<Locale, TranslationMessages> = {
  en: enMessages,
  es: esMessages,
};

function translate(
  locale: Locale,
  key: TranslationKey,
  values?: TranslationValues,
): string {
  const template =
    TRANSLATIONS[locale][key] ?? TRANSLATIONS[DEFAULT_LOCALE][key];

  return interpolateTemplate(template ?? key, {}, values ?? {});
}

function resolveLocale(
  queryLang: string | null,
  fallbackLocale: Locale,
): { locale: Locale; queryLocale: Locale | null } {
  const queryLocale = toSupportedLocale(queryLang);

  if (queryLocale) {
    return { locale: queryLocale, queryLocale };
  }

  return { locale: fallbackLocale, queryLocale: null };
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

export function I18nProvider(props: {
  children: ReactNode;
  fallbackLocale: Locale;
}) {
  const searchParams = useSearchParams();
  const resolved = resolveLocale(
    searchParams.get('lang'),
    props.fallbackLocale,
  );

  const value: I18nContextValue = {
    locale: resolved.locale,
    t: (key, values) => translate(resolved.locale, key, values),
    withLang: (path) => {
      if (!resolved.queryLocale) {
        return path;
      }

      const [pathname, query = ''] = path.split('?');

      const params = new URLSearchParams(query);
      params.set('lang', resolved.queryLocale);

      return `${pathname}?${params.toString()}`;
    },
  };

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  );
}

export function useSyncLangParam(formLocale: string | undefined): void {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!formLocale || searchParams.get('lang') === formLocale) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('lang', formLocale);

    replaceSearchParams(next);
  }, [formLocale, searchParams]);
}
