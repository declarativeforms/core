import 'server-only';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, toSupportedLocale, type Locale } from './locale';

export async function resolveRequestLocale(): Promise<Locale> {
  const accepted = (await headers()).get('accept-language') ?? '';

  const preferred = accepted
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';q=');
      return { tag, quality: quality ? Number(quality) : 1 };
    })
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => toSupportedLocale(entry.tag))
    .find((locale): locale is Locale => locale !== null);

  return preferred ?? DEFAULT_LOCALE;
}
