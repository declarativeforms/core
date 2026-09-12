'use client';
import { useEffect } from 'react';
import { getRuntimeConfig } from '@/lib/runtime-config';

export function GoogleMapsLoader(): null {
  useEffect(() => {
    const apiKey = getRuntimeConfig().googleMapsApiKey;

    if (!apiKey || document.getElementById('google-maps-sdk')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    document.head.appendChild(script);
  }, []);

  return null;
}
