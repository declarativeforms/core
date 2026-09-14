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
  title: 'Forms as Code for engineering workflows — Declarative Forms',
  description:
    'Forms as Code for engineering workflows. Keep your YAML definition in GitHub; Declarative Forms renders the form, validates answers, and stores submissions.',
  openGraph: {
    title: 'Live forms. Maintained in GitHub.',
    description:
      'Forms as Code for engineering workflows. Keep your YAML definition in GitHub; Declarative Forms renders the form, validates answers, and stores submissions.',
    images: [LANDING_OG_IMAGE],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live forms. Maintained in GitHub.',
    description:
      'Forms as Code for engineering workflows. Keep your YAML definition in GitHub; Declarative Forms renders the form, validates answers, and stores submissions.',
    images: [LANDING_OG_IMAGE],
  },
};

export default function HomePage(): React.JSX.Element {
  return <LandingPage />;
}
