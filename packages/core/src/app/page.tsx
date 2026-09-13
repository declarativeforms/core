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
    'Keep your form with your code. Define it in YAML, commit it to GitHub, and share a hosted form with rendering, validation, and submissions handled for you.',
  openGraph: {
    title: 'Forms that live in your Git repo.',
    description:
      'Keep your form with your code. Define it in YAML, commit it to GitHub, and share a hosted form with rendering, validation, and submissions handled for you.',
    images: [LANDING_OG_IMAGE],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forms that live in your Git repo.',
    description:
      'Keep your form with your code. Define it in YAML, commit it to GitHub, and share a hosted form with rendering, validation, and submissions handled for you.',
    images: [LANDING_OG_IMAGE],
  },
};

export default function HomePage(): React.JSX.Element {
  return <LandingPage />;
}
