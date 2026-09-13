import type { Metadata } from 'next';
import { DocumentationPage } from '@/views/documentation.page';

export const metadata: Metadata = {
  alternates: { canonical: '/docs' },
  title: 'Create a form from YAML',
  description:
    'Create a YAML form in your GitHub repository, by hand or with your coding agent, and share it through Declarative Forms.',
  openGraph: { url: '/docs' },
};

export default function Page(): React.JSX.Element {
  return <DocumentationPage />;
}
