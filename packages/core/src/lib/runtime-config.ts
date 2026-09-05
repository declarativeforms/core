'use client';

declare global {
  interface Window {
    __CONFIG__?: {
      googleMapsApiKey?: string;
      posthogApiHost?: string;
      posthogProjectKey?: string;
    };
  }
}

export function runtimeConfig(): NonNullable<Window['__CONFIG__']> {
  return (typeof window === 'undefined' ? undefined : window.__CONFIG__) ?? {};
}
