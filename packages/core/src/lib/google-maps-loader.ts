import { runtimeConfig } from './runtime-config';

/**
 * Inject the Google Maps JS SDK (Places library) at runtime, but only when an
 * API key is configured.
 *
 * The key comes from the container's `GOOGLE_MAPS_API_KEY` at startup, falling
 * back to the build-time `VITE_GOOGLE_MAPS_API_KEY` for local development.
 *
 * Without a key, no script is loaded and `address` fields fall back to manual
 * text entry, so self-hosting without a Google Maps account is fully supported.
 */
export function loadGoogleMaps(): void {
  const apiKey =
    runtimeConfig().googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
