const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1";

export function getBackendUrl(path: string): string {
  return `${API_BASE_URL}/${path}`;
}
