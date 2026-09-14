import type { Metadata } from 'next';
import { LandingPage } from '@/views/landing.page';

const LANDING_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Declarative Forms hero showing a GitHub-maintained form definition and its YAML example.',
};

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: { absolute: 'Forms as Code — Declarative Forms' },
  description:
    'Keep your form definition in GitHub. Publish a live form with validation and submission storage.',
  openGraph: {
    siteName: 'Declarative Forms',
    url: '/',
    title: 'Declarative Forms — Live forms, maintained in GitHub',
    description:
      'Keep your form definition in GitHub. Publish a live form with validation and submission storage.',
    images: [LANDING_OG_IMAGE],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Declarative Forms — Live forms, maintained in GitHub',
    description:
      'Keep your form definition in GitHub. Publish a live form with validation and submission storage.',
    images: [LANDING_OG_IMAGE],
  },
};

export default function HomePage(): React.JSX.Element {
  return <LandingPage />;
}
