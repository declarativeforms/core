'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { I18nProvider } from '@/i18n';
import type { Locale } from '@/i18n/locale';

export function Providers(props: {
  children: ReactNode;
  fallbackLocale: Locale;
}) {
  // Per-request, not a module singleton: a singleton would be shared across
  // every request and every user on the server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider fallbackLocale={props.fallbackLocale}>
        {props.children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
