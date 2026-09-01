'use client';

import { useEffect, useState } from 'react';

import { runtimeConfig } from '@/lib/runtime-config';

const POLL_INTERVAL_MS = 100;

function isPlacesLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps?.places;
}

export function useGooglePlacesReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !runtimeConfig().googleMapsApiKey) {
      return;
    }

    const interval = setInterval(() => {
      if (isPlacesLoaded()) {
        setReady(true);
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [ready]);

  return ready;
}
