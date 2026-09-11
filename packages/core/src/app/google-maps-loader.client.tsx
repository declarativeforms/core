'use client';
import { useEffect } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';

export function GoogleMapsLoader(): null {
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  return null;
}
