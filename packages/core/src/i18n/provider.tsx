import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { I18nContext, type I18nContextValue } from "./context";
import { resolveLocale, translate } from "./runtime";

export function I18nProvider(props: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const queryLang = searchParams.get("lang");

  const { locale, queryLocale } = useMemo(
    () => resolveLocale(queryLang),
    [queryLang]
  );

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      t: (key, values) => translate(locale, key, values),
      withLang: (path: string) => {
        if (!queryLocale) {
          return path;
        }

        const url = new URL(path, window.location.origin);
        url.searchParams.set("lang", queryLocale);
        return `${url.pathname}${url.search}${url.hash}`;
      },
    };
  }, [locale, queryLocale]);

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}
