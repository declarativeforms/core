import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { metadataBase, SITE_NAME } from '@/lib/form-metadata';
import { resolveRequestLocale } from '@/i18n/server';

import { GoogleMapsLoader } from './google-maps-loader.client';
import { Providers } from './providers';
import { RuntimeConfigScript } from './runtime-config-script';
import './globals.css';

// Every page reads request-time state: the runtime config, `Accept-Language`,
// and `?lang` through `useSearchParams`. Nothing here is prerenderable.
export const dynamic = 'force-dynamic';

const SITE_DESCRIPTION =
  'Forms that live in your Git repo. Write a form as a YAML file, commit it, and it renders as a live, hosted form.';

// A function rather than a constant so `metadataBase` can come from the request:
// the app is self-hosted under whatever domain the operator points at it, and
// without an origin Next resolves the OpenGraph image against localhost.
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await metadataBase(),
    // `%s — Declarative Forms` is the title `BasePage` has always assembled by
    // hand for `document.title`; pages now supply only their own half.
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

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
        {/* First child of <body>: runs during parsing, before the bundle. */}
        <RuntimeConfigScript />
        <Providers fallbackLocale={fallbackLocale}>
          <GoogleMapsLoader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
