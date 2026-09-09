import type { SearchParams } from '@/app/search-params.types';
import type { Metadata } from 'next';
import { formMetadata } from '@/lib/form-metadata';
import { FormRoute } from '@/views/form-route';
import { PageShell } from '@/app/page-shell';

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await props.params;
  const query = await props.searchParams;

  return formMetadata(
    {
      id: params.slug,
      branch: typeof query.branch === 'string' ? query.branch : undefined,
    },
    typeof query.lang === 'string' ? query.lang : undefined,
  );
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.params;
  const query = await props.searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <FormRoute id={params.slug} />
    </PageShell>
  );
}
