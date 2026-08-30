import 'server-only';

import { headers } from 'next/headers';

import { DEFAULT_LOCALE, toSupportedLocale, type Locale } from './locale';

/**
 * The locale to fall back to when the URL carries no `?lang`.
 *
 * The client used to read `navigator.language`, which is undefined on the
 * server. Resolving from `Accept-Language` instead means server and client
 * agree on the first render, so the form tree is not thrown away and rebuilt.
 */
export async function resolveRequestLocale(): Promise<Locale> {
  const accepted = (await headers()).get('accept-language') ?? '';

  const preferred = accepted
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';q=');
      return { tag, quality: quality ? Number(quality) : 1 };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(({ tag }) => toSupportedLocale(tag))
    .find((locale): locale is Locale => locale !== null);

  return preferred ?? DEFAULT_LOCALE;
}
