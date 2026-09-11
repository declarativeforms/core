'use client';

declare global {
  interface Window {
    __CONFIG__?: {
      googleMapsApiKey?: string;
      turnstileSiteKey?: string;
      posthogApiHost?: string;
      posthogProjectKey?: string;
    };
  }
}

export function getRuntimeConfig(): NonNullable<Window['__CONFIG__']> {
  return (typeof window === 'undefined' ? undefined : window.__CONFIG__) ?? {};
}
