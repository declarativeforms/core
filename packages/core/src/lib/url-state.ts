'use client';

export function replaceSearchParams(searchParams: URLSearchParams): void {
  const query = searchParams.toString();

  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
  );
}
