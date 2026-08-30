'use client';

import { useEffect } from 'react';

import { loadGoogleMaps } from '@/lib/google-maps-loader';

/**
 * Optional: enables address autocomplete when a Google Maps key is configured.
 * Runs in an effect rather than at module scope so it never executes on the
 * server, and after `RuntimeConfigScript` has populated `window.__CONFIG__`.
 */
export function GoogleMapsLoader() {
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  return null;
}
