import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

// Fix Leaflet's default marker icon issue with bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

type LeafletIconDefaultPrototype = typeof L.Icon.Default.prototype & { _getIconUrl?: string };
delete (L.Icon.Default.prototype as LeafletIconDefaultPrototype)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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
      <Marker position={position} />
    </MapContainer>
  );
}
