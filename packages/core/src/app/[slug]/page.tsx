import type { Metadata } from 'next';

import { formMetadata } from '@/lib/form-metadata';
import { FormRoute } from '@/views/form-route';

import { PageShell } from '../page-shell';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;

  return formMetadata({ id: slug }, typeof lang === 'string' ? lang : undefined);
}

/**
 * A form addressed by its id. `[slug]` rather than `[id]` because Next requires
 * one name per dynamic position, and the deeper GitHub route needs this same
 * segment to carry the repository owner.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <FormRoute id={slug} />
    </PageShell>
  );
}
