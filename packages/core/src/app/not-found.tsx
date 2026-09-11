import { NotFoundPage } from '@/views/not-found.page';
import { PageShell } from './page-shell';

export default function NotFound(): React.JSX.Element {
  return (
    <PageShell>
      <NotFoundPage />
    </PageShell>
  );
}
