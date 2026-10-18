import type { SearchParams } from '@/app/search-params.types';
import type { Metadata } from 'next';
import { buildFormMetadata } from '@/lib/form-metadata';
import { FormRoute } from '@/views/form-route';
import { PageShell } from '@/app/page-shell';
import { FormScrollDiagnostics } from '@/app/form-scroll-diagnostics.client';

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await props.params;
  const query = await props.searchParams;

  return buildFormMetadata(
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
}): Promise<React.JSX.Element> {
  const params = await props.params;
  const query = await props.searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      {query.debug_scroll === '1' || query.debug_scroll === 'no_focus' ? (
        <FormScrollDiagnostics
          disableSectionFocus={query.debug_scroll === 'no_focus'}
        />
      ) : null}
      <FormRoute id={params.slug} />
    </PageShell>
  );
}
