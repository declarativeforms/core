'use client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

function resolveAssetUrl(asset: string | { src: string }): string {
  return typeof asset === 'string' ? asset : asset.src;
}

const MARKER_ICON = L.icon({
  iconUrl: resolveAssetUrl(markerIcon),
  iconRetinaUrl: resolveAssetUrl(markerIcon2x),
  shadowUrl: resolveAssetUrl(markerShadow),
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
  if (accuracy < 100) {
    return 16;
  }

  if (accuracy < 500) {
    return 14;
  }

  return 12;
}

export default function GeolocationMapPreview(
  props: GeolocationMapPreviewProps,
): React.JSX.Element {
  const position: L.LatLngExpression = [props.latitude, props.longitude];

  return (
    <MapContainer
      center={position}
      zoom={getZoomLevel(props.accuracy)}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-[200px] w-full rounded-md border"
      aria-label={props.label}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position} icon={MARKER_ICON} />
    </MapContainer>
  );
}
