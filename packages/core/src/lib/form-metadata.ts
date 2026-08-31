import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import type { Metadata } from 'next';

import {
  interpolateTemplate,
  resolveLocalizedText,
  type IDeclarativeForm,
  type ILocalizedText,
} from '@declarativeforms/engine';

import { resolveRequestLocale } from '@/i18n/server';
import { stripHtml } from './strip-html';

/** The product name, appended to every page title and shown on the share card. */
export const SITE_NAME = 'Declarative Forms';

/**
 * How long a form may be reused across requests.
 *
 * The API fetches every form live from GitHub with `cache: 'no-store'`, and the
 * slug route also writes to Mongo on each hit. A single page view now asks for
 * the form three times (the page's own client fetch, `generateMetadata`, and the
 * OpenGraph image), so without this the cost of adding metadata would be three
 * round trips to GitHub instead of one.
 */
const REVALIDATE_SECONDS = 300;

/**
 * Where the API lives, as seen from the server.
 *
 * The browser calls `/api/v1/...` and `next.config.ts` rewrites it, but a
 * rewrite only applies to requests arriving at the Next server: a `fetch` from a
 * server component is an outbound call and never passes through it. The default
 * is load-bearing, because Compose never sets the variable on the `web` service.
 */
function apiOrigin(): string {
  return process.env.API_INTERNAL_ORIGIN ?? 'http://api:8080';
}

export type FormRouteTarget =
  | { id: string }
  | { owner: string; repository: string; path: string; branch?: string };

function formUrl(target: FormRouteTarget): string {
  if ('id' in target) {
    return `${apiOrigin()}/api/v1/forms/${encodeURIComponent(target.id)}`;
  }

  const path = target.path.split('/').map(encodeURIComponent).join('/');
  const url = new URL(
    `/api/v1/forms/${encodeURIComponent(target.owner)}/${encodeURIComponent(
      target.repository,
    )}/${path}`,
    apiOrigin(),
  );

  if (target.branch) {
    url.searchParams.set('branch', target.branch);
  }

  return url.toString();
}

/**
 * The form behind a route, or `null` if it cannot be read.
 *
 * Never throws and never calls `notFound()`. The API answers with an empty-bodied
 * 404 for a missing form, a private repository and a rate-limited GitHub alike,
 * so a failure here has to degrade to the site's default metadata rather than
 * turn a transient outage into a 404 page.
 */
export const fetchForm = cache(async function fetchForm(
  target: FormRouteTarget,
): Promise<IDeclarativeForm | null> {
  try {
    const response = await fetch(formUrl(target), {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as IDeclarativeForm;
  } catch {
    return null;
  }
});

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Turn the entities an author has to write inside HTML text back into the
 * characters they meant. `stripHtml` removes tags but leaves entities alone, so
 * without this a title of `Q&amp;A` would be shared as the literal `Q&amp;A`.
 */
function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = Number.parseInt(
        entity.slice(isHex ? 2 : 1),
        isHex ? 16 : 10,
      );
      // `fromCodePoint` throws outside this range, and a malformed entity in a
      // form title must not take the whole page's metadata down with it.
      return codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    }
    return HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Localized form text as a single plain line.
 *
 * Titles and descriptions are authored as HTML and may carry `{{data.*}}`
 * templates. There are no answers to interpolate with at metadata time, so
 * Handlebars resolves the placeholders to nothing instead of leaking braces into
 * a link preview.
 */
export function resolveFormText(
  text: ILocalizedText | undefined,
  locale: string,
): string {
  const resolved = resolveLocalizedText(text, locale);
  if (!resolved) {
    return '';
  }

  return decodeEntities(stripHtml(interpolateTemplate(resolved, {})))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The language to present a form in: an explicit `?lang`, else the form's own
 * declared locale, else what the request's `Accept-Language` asked for.
 *
 * The OpenGraph image route is handed `params` only, so it passes no `lang` and
 * falls through to the form's locale.
 */
export async function resolveFormLocale(
  form: IDeclarativeForm | null,
  lang?: string,
): Promise<string> {
  return lang || form?.locale || (await resolveRequestLocale());
}

/**
 * The origin this request arrived on.
 *
 * Without it Next resolves the OpenGraph image against `http://localhost:3000`.
 * Traefik terminates TLS in front of the app, so the scheme is only knowable
 * from the forwarded header.
 */
export async function metadataBase(): Promise<URL> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ??
    requestHeaders.get('host') ??
    'localhost';
  const protocol =
    requestHeaders.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https');

  return new URL(`${protocol}://${host}`);
}

/**
 * Page metadata for a form route. Falls back to the site defaults from the root
 * layout when the form could not be read, so the title is never empty.
 */
export async function formMetadata(
  target: FormRouteTarget,
  lang?: string,
): Promise<Metadata> {
  const form = await fetchForm(target);

  // The card URL is always stated explicitly, never left to the
  // `opengraph-image.tsx` file convention. Two reasons: Next resolves
  // convention URLs against a base fixed at startup, so behind a proxy they
  // come out pointing at localhost, while `metadataBase` is per-request; and a
  // metadata image cannot live inside a catch-all segment, so the GitHub route
  // borrows the canonical `/{id}` card the client rewrites to anyway.
  const cardId = 'id' in target ? target.id : form?.id;
  const images = cardId ? [`/${cardId}/opengraph-image`] : undefined;

  // Unreadable: missing, private, or GitHub rate-limited the API. Inherit the
  // site's title and description rather than name the page after a slug that
  // resolved to nothing; the card still renders, in its fallback form.
  if (!form) {
    return images ? { openGraph: { images } } : {};
  }

  const locale = await resolveFormLocale(form, lang);
  const title = resolveFormText(form.title, locale) || form.id;
  const description = resolveFormText(form.description, locale) || undefined;

  if (!title) {
    return images ? { openGraph: { images } } : {};
  }

  return {
    title,
    description,
    // `siteName` is repeated because page metadata replaces the layout's
    // `openGraph` object wholesale rather than merging into it.
    openGraph: {
      title,
      description,
      images,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}
