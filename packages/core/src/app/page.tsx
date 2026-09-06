import type { Metadata } from 'next';
import { LandingPage } from '@/views/landing.page';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'Git-native Forms as Code — Declarative Forms',
  description:
    'Define forms in YAML, keep them in GitHub, and turn them into live, hosted forms with a versioned, reviewable source of truth.',
  openGraph: {
    title: 'Forms that live in your Git repo.',
    description:
      'Define forms in YAML, keep them in GitHub, and turn them into live, hosted forms with a versioned, reviewable source of truth.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Forms that live in your Git repo.',
    description:
      'Define forms in YAML, keep them in GitHub, and turn them into live, hosted forms with a versioned, reviewable source of truth.',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
