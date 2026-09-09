'use client';

export function replaceSearchParams(next: URLSearchParams): void {
  const query = next.toString();

  window.history.replaceState(
    null,
    '',
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}

export function replacePath(pathWithQuery: string): void {
  window.history.replaceState(null, '', pathWithQuery);
}
