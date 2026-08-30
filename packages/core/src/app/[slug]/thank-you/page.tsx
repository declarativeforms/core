import { ThankYouPage } from '@/views/thank-you.page';

import { PageShell } from '../../page-shell';

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
      <ThankYouPage id={slug} />
    </PageShell>
  );
}
