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

export const SITE_NAME = 'Declarative Forms';

const REVALIDATE_SECONDS = 300;

function apiOrigin(): string {
  return process.env.API_INTERNAL_ORIGIN ?? 'http://api:8080';
}

export type FormRouteTarget =
  | { id: string; branch?: string }
  | { owner: string; repository: string; path: string; branch?: string };

function formUrl(target: FormRouteTarget): string {
  if ('id' in target) {
    const idUrl = new URL(
      `/api/v1/forms/${encodeURIComponent(target.id)}`,
      apiOrigin(),
    );

    if (target.branch) {
      idUrl.searchParams.set('branch', target.branch);
    }

    return idUrl.toString();
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

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = Number.parseInt(
        entity.slice(isHex ? 2 : 1),
        isHex ? 16 : 10,
      );

      return codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    }

    return HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

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

export async function resolveFormLocale(
  form: IDeclarativeForm | null,
  lang?: string,
): Promise<string> {
  return lang || form?.locale || (await resolveRequestLocale());
}

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

export async function formMetadata(
  target: FormRouteTarget,
  lang?: string,
): Promise<Metadata> {
  const form = await fetchForm(target);

  const cardId = 'id' in target ? target.id : form?.id;
  const images = cardId ? [`/${cardId}/opengraph-image`] : undefined;

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
