import type { Metadata } from 'next';
import { LandingPage } from '@/views/landing.page';

const LANDING_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Declarative Forms landing page shown in a macOS-style window',
};

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'Git-native Forms as Code — Declarative Forms',
  description:
    'Define forms in YAML, keep them in GitHub, and turn them into live, hosted forms with a versioned, reviewable source of truth.',
  openGraph: {
    title: 'Forms that live in your Git repo.',
    description:
      'Define forms in YAML, keep them in GitHub, and turn them into live, hosted forms with a versioned, reviewable source of truth.',
    images: [LANDING_OG_IMAGE],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forms that live in your Git repo.',
    description:
      'Define forms in YAML, keep them in GitHub, and turn them into live, hosted forms with a versioned, reviewable source of truth.',
    images: [LANDING_OG_IMAGE],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
