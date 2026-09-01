'use client';
import { useEffect } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';

export function GoogleMapsLoader() {
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  return null;
}
