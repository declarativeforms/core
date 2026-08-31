import type { Metadata } from 'next';

import { formMetadata } from '@/lib/form-metadata';
import { FormRoute } from '@/views/form-route';

import { PageShell } from '../../../page-shell';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; repository: string; path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug, repository, path } = await params;
  const { branch, lang } = await searchParams;

  return formMetadata(
    {
      owner: slug,
      repository,
      path: path.join('/'),
      branch: typeof branch === 'string' ? branch : undefined,
    },
    typeof lang === 'string' ? lang : undefined,
  );
}

/**
 * A form addressed by its GitHub location: `/{owner}/{repository}/{path}`.
 *
 * `[slug]` carries the repository owner here. Once the form loads, the client
 * swaps the URL for the canonical `/{form.id}`.
 *
 * A repository literally named `thank-you` would be shadowed by the sibling
 * static segment. Not reachable in practice.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; repository: string; path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, repository, path } = await params;
  const query = await searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <FormRoute
        owner={slug}
        repository={repository}
        slugPath={path.join('/')}
      />
    </PageShell>
  );
}
