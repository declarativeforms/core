'use client';
import { getRuntimeConfig } from './runtime-config';

export function loadGoogleMaps(): void {
  const apiKey = getRuntimeConfig().googleMapsApiKey;

  if (!apiKey || typeof document === 'undefined') {
    return;
  }

  if (document.getElementById('google-maps-sdk')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'google-maps-sdk';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;

  document.head.appendChild(script);
}
