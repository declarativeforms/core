import type { ILocalizedText } from "@declarativeforms/types"

function normalizeLocaleKey(locale: string): string {
  return locale.trim().toLowerCase().replace(/_/g, "-")
}

function getObjectLocalizedValue(
  input: Record<string, string>,
  locale: string,
): string | undefined {
  const normalizedLocale = normalizeLocaleKey(locale)
  const normalizedEntries = Object.entries(input).reduce(
    (acc, [key, value]) => {
      acc[normalizeLocaleKey(key)] = value
      return acc
    },
    {} as Record<string, string>,
  )

  const baseLocale = normalizedLocale.split("-")[0]
  const candidates = [normalizedLocale, baseLocale, "en"]

  for (const candidate of candidates) {
    const value = normalizedEntries[candidate]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  for (const value of Object.values(normalizedEntries)) {
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return undefined
}

export function resolveLocalizedText(
  input: ILocalizedText | undefined,
  locale?: string,
): string {
  if (typeof input === "string") {
    return input
  }

  if (!input) {
    return ""
  }

  return getObjectLocalizedValue(input, locale ?? "en") ?? ""
}
