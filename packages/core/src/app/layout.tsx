import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { metadataBase, SITE_NAME } from '@/lib/form-metadata';
import { resolveRequestLocale } from '@/i18n/server';
import { GoogleMapsLoader } from './google-maps-loader.client';
import { Providers } from './providers';
import { RuntimeConfigScript } from './runtime-config-script';
import { WebAnalytics } from './web-analytics.client';
import './globals.css';

export const dynamic = 'force-dynamic';

const SITE_DESCRIPTION =
  'Forms that live in your Git repo. Write a form as a YAML file, commit it, and it renders as a live, hosted form.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await metadataBase(),
    title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    icons: { icon: '/favicon-32x32.png' },
    openGraph: {
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout(props: { children: ReactNode }) {
  const fallbackLocale = await resolveRequestLocale();

  return (
    <html lang={fallbackLocale} className="bg-neutral-50 min-h-lvh">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-neutral-50 min-h-lvh">
        <RuntimeConfigScript />
        <WebAnalytics />
        <Providers fallbackLocale={fallbackLocale}>
          <GoogleMapsLoader />
          {props.children}
        </Providers>
      </body>
    </html>
  );
}
