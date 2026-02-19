import { createContext } from "react";

import type { Locale } from "./locales";
import type { TranslationKey } from "./messages/en";
import type { TranslationValues } from "./runtime";

export type I18nContextValue = {
  locale: Locale;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  withLang: (path: string) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
