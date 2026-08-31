'use client';

import { useEffect, useState } from 'react';

import { runtimeConfig } from '@/lib/runtime-config';

const POLL_INTERVAL_MS = 100;

function isPlacesLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps?.places;
}

/**
 * Whether Google Places autocomplete can be used right now.
 *
 * The SDK script is injected once per page by `GoogleMapsLoader` in the root
 * layout, so this only has to wait for it to land. It polls rather than hooking
 * the script's `onload` because the script may already have loaded before an
 * address field mounts.
 *
 * With no `GOOGLE_MAPS_API_KEY` configured no script is ever injected, so this
 * returns `false` immediately and never polls — that is the supported
 * self-hosting path, and the field falls back to plain text entry. There is
 * deliberately no timeout: a slow script would otherwise strand the field in
 * the fallback for the life of the mount.
 */
export function useGooglePlacesReady(): boolean {
  // Seeded `false`, never from the probe: it reads a browser global, so seeding
  // it would make the server and client disagree on first render.
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
