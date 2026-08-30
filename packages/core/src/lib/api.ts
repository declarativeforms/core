/**
 * The browser always talks to the API same-origin. `next.config.ts` rewrites
 * `/api/*` to the backend, so there is no cross-origin hop and no build-time
 * base URL baked into the bundle.
 */
const API_BASE_URL = '/api/v1';

export function getBackendUrl(path: string): string {
  return `${API_BASE_URL}/${path}`;
}
