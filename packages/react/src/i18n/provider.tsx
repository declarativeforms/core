import { useEffect, useState, type ReactNode } from 'react';

import { I18nContext, type I18nContextValue } from './context';
import { resolveLocale, translate } from './runtime';

export function I18nProvider(props: { children: ReactNode; locale?: string }) {
  const [locationLocale, setLocationLocale] = useState(() =>
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('lang'),
  );

  useEffect(() => {
    if (props.locale !== undefined || typeof window === 'undefined') {
      return;
    }

    const updateLocale = () =>
      setLocationLocale(
        new URLSearchParams(window.location.search).get('lang'),
      );
    window.addEventListener('popstate', updateLocale);
    window.addEventListener('declarativeforms:locationchange', updateLocale);
    return () => {
      window.removeEventListener('popstate', updateLocale);
      window.removeEventListener(
        'declarativeforms:locationchange',
        updateLocale,
      );
    };
  }, [props.locale]);

  const queryLang = props.locale ?? locationLocale;
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
