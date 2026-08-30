'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

import { interpolateTemplate } from '@declarativeforms/engine';

import { replaceSearchParams } from '@/lib/url-state';
import {
  DEFAULT_LOCALE,
  toSupportedLocale,
  type Locale,
} from './locale';
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
  // UI messages use top-level placeholders (e.g. {{min}}, {{label}}, {{count}}).
  // The engine resolves those from the interpolation context (its third
  // argument); the second argument is reserved for `{{data.*}}` form values.
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
  // The fallback is resolved server-side from `Accept-Language`, so this
  // returns the same value during SSR and on the client.
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
  const { locale, queryLocale } = resolveLocale(
    searchParams.get('lang'),
    props.fallbackLocale,
  );

  const value: I18nContextValue = {
    locale,
    t: (key, values) => translate(locale, key, values),
    withLang: (path) => {
      if (!queryLocale) {
        return path;
      }
      // Built by hand rather than via `new URL`: this runs during render, and
      // there is no `window.location.origin` on the server.
      const [pathname, query = ''] = path.split('?');
      const params = new URLSearchParams(query);
      params.set('lang', queryLocale);
      return `${pathname}?${params.toString()}`;
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
