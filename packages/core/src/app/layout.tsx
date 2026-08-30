import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { resolveRequestLocale } from '@/i18n/server';

import { GoogleMapsLoader } from './google-maps-loader.client';
import { Providers } from './providers';
import { RuntimeConfigScript } from './runtime-config-script';
import './globals.css';

// Every page reads request-time state: the runtime config, `Accept-Language`,
// and `?lang` through `useSearchParams`. Nothing here is prerenderable.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Declarative Forms',
  icons: { icon: '/favicon-32x32.png' },
};

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
