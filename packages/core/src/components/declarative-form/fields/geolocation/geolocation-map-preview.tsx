'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

/**
 * Leaflet resolves its default marker icon by guessing a URL relative to its
 * own stylesheet, which no bundler layout satisfies. The usual workaround
 * patches `L.Icon.Default` at module scope; that silently does nothing when
 * more than one copy of leaflet ends up in the graph, leaving the map to throw
 * "iconUrl not set in Icon options" the first time a marker mounts.
 *
 * Building the icon explicitly and handing it to the `Marker` avoids the
 * question: it uses the same `L` this module imported, and mutates nothing.
 */
function assetUrl(asset: string | { src: string }): string {
  return typeof asset === 'string' ? asset : asset.src;
}

const MARKER_ICON = L.icon({
  iconUrl: assetUrl(markerIcon),
  iconRetinaUrl: assetUrl(markerIcon2x),
  shadowUrl: assetUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

type GeolocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  accuracy: number;
  label: string;
};

function getZoomLevel(accuracy: number): number {
  if (accuracy < 100) return 16;
  if (accuracy < 500) return 14;
  return 12;
}

export default function GeolocationMapPreview({
  latitude,
  longitude,
  accuracy,
  label,
}: GeolocationMapPreviewProps) {
  const position: L.LatLngExpression = [latitude, longitude];

  return (
    <MapContainer
      center={position}
      zoom={getZoomLevel(accuracy)}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-[200px] w-full rounded-md border"
      aria-label={label}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position} icon={MARKER_ICON} />
    </MapContainer>
  );
}
