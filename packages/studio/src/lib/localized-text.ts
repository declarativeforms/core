import type { ILocalizedText } from "@declarativeforms/types";

export type LocalizedTextEntry = {
  locale: string;
  value: string;
};

export function isLocalizedTextObject(
  value: ILocalizedText | undefined,
): value is Record<string, string> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function getLocalizedTextPreview(value: ILocalizedText | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (!value) {
    return "";
  }

  const firstNonEmpty = Object.values(value).find(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  );

  return typeof firstNonEmpty === "string" ? firstNonEmpty : "";
}

export function getDefaultLocale(locale: string | undefined) {
  const normalized = locale?.trim();
  return normalized && normalized.length > 0 ? normalized : "en";
}

export function getLocalizedTextEntries(
  value: ILocalizedText | undefined,
): LocalizedTextEntry[] {
  if (!isLocalizedTextObject(value)) {
    return [];
  }

  return Object.entries(value).map(([locale, entryValue]) => ({
    locale,
    value: typeof entryValue === "string" ? entryValue : "",
  }));
}

export function buildLocalizedTextFromEntries(entries: LocalizedTextEntry[]) {
  const result: Record<string, string> = {};

  for (const entry of entries) {
    const locale = entry.locale.trim();

    if (!locale) {
      continue;
    }

    result[locale] = entry.value;
  }

  return result;
}

export function createNextLocaleKey(
  entries: LocalizedTextEntry[],
  defaultLocale: string,
) {
  const normalizedDefault = getDefaultLocale(defaultLocale);
  const existingLocales = new Set(entries.map((entry) => entry.locale.trim()));

  if (!existingLocales.has(normalizedDefault)) {
    return normalizedDefault;
  }

  let suffix = 2;

  while (existingLocales.has(`${normalizedDefault}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalizedDefault}-${suffix}`;
}

export function hasLocalizedTextContent(value: ILocalizedText | undefined) {
  return getLocalizedTextPreview(value).trim().length > 0;
}

export function updateLocalizedTextAtLocale(
  current: ILocalizedText | undefined,
  nextValue: string,
  locale: string | undefined,
): ILocalizedText {
  if (isLocalizedTextObject(current)) {
    return {
      ...current,
      [getDefaultLocale(locale)]: nextValue,
    };
  }

  return nextValue;
}
