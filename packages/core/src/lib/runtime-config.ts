'use client';

declare global {
  interface Window {
    __CONFIG__?: {
      googleMapsApiKey?: string;
    };
  }
}

export function runtimeConfig(): NonNullable<Window['__CONFIG__']> {
  return (typeof window === 'undefined' ? undefined : window.__CONFIG__) ?? {};
}
