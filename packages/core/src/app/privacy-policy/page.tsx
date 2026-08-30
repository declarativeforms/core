import { PrivacyPolicyPage } from '@/views/privacy-policy.page';

import { PageShell } from '../page-shell';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;

  return (
    <PageShell embed={query.embed === 'true'}>
      <PrivacyPolicyPage />
    </PageShell>
  );
}
