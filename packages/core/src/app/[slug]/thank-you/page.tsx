import type { SearchParams } from '@/app/search-params.types';
import { ThankYouPage } from '@/views/thank-you.page';
import { PageShell } from '@/app/page-shell';

export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.params;
  const query = await props.searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <ThankYouPage id={params.slug} />
    </PageShell>
  );
}
