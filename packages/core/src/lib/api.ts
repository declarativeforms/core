const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export function getBackendUrl(path: string): string {
  return `${API_BASE_URL}/${path}`;
}
