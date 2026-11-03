import type { Metadata } from 'next';
import { LandingPage } from '@/views/landing.page';

const LANDING_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Declarative Forms preview showing “A live form from a file you own.” beside a YAML form definition.',
};

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: { absolute: 'A live form from a file you own — Declarative Forms' },
  description:
    'Build a form from a GitHub definition or create it with ChatGPT. Declarative Forms renders questions, validates answers, and stores submissions.',
  openGraph: {
    siteName: 'Declarative Forms',
    url: '/',
    title: 'A live form from a file you own — Declarative Forms',
    description:
      'Build a form from a GitHub definition or create it with ChatGPT. Declarative Forms renders questions, validates answers, and stores submissions.',
    images: [LANDING_OG_IMAGE],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A live form from a file you own — Declarative Forms',
    description:
      'Build a form from a GitHub definition or create it with ChatGPT. Declarative Forms renders questions, validates answers, and stores submissions.',
    images: [LANDING_OG_IMAGE],
  },
};

export default function HomePage(): React.JSX.Element {
  return <LandingPage />;
}
