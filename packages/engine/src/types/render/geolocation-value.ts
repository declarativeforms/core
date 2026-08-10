/**
 * The value produced by a geolocation field. The field's stored value is
 * `IRenderableGeolocationValue | null` (null before a location is captured).
 */
export type IRenderableGeolocationValue = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};
