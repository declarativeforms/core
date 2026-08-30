'use client';

/**
 * Replace the current URL's query string in place.
 *
 * The App Router patches `history.replaceState`, so `usePathname()` and
 * `useSearchParams()` re-render from the new URL without issuing an RSC
 * request. `router.replace()` would round-trip to the server on every section
 * submit and would also reset scroll; this matches what React Router's
 * `setSearchParams(next, { replace: true })` did.
 */
export function replaceSearchParams(next: URLSearchParams): void {
  const query = next.toString();

  window.history.replaceState(
    null,
    '',
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}

/** Replace the whole path (and optionally query) without an RSC request. */
export function replacePath(pathWithQuery: string): void {
  window.history.replaceState(null, '', pathWithQuery);
}
