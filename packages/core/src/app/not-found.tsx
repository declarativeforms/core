import { NotFoundPage } from '@/views/not-found.page';

import { PageShell } from './page-shell';

export default function NotFound() {
  // `not-found.tsx` receives no `searchParams`, so the embed variant is not
  // available here. The 404 always renders in the default chrome.
  return (
    <PageShell>
      <NotFoundPage />
    </PageShell>
  );
}
