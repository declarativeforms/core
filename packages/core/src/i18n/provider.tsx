import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { I18nContext, type I18nContextValue } from './context';
import { resolveLocale, translate } from './runtime';

export function I18nProvider(props: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const queryLang = searchParams.get('lang');
  const resolvedLocale = resolveLocale(queryLang);
  const contextValue: I18nContextValue = {
    locale: resolvedLocale.locale,
    t: (key, values) => translate(resolvedLocale.locale, key, values),
    withLang: (path: string) => {
      if (!resolvedLocale.queryLocale) {
        return path;
      }

      const url = new URL(path, window.location.origin);
      url.searchParams.set('lang', resolvedLocale.queryLocale);
      return `${url.pathname}${url.search}${url.hash}`;
    },
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {props.children}
    </I18nContext.Provider>
  );
}
