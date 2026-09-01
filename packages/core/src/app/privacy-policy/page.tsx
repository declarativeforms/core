import type { SearchParams } from '@/app/search-params.types';
import { PrivacyPolicyPage } from '@/views/privacy-policy.page';
import { PageShell } from '@/app/page-shell';

export default async function Page(props: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await props.searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <PrivacyPolicyPage />
    </PageShell>
  );
}
