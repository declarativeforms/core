'use client';

import { useEffect, useState } from 'react';

/**
 * Resolve to `true` once `check()` passes, polling until it does or `timeout`
 * elapses. Used to wait for an externally-loaded browser global (e.g. the
 * Google Maps script) before a component that depends on it renders.
 */
export function useWaitForGlobal(
  check: () => boolean,
  { interval = 100, timeout = 10_000 } = {},
): boolean {
  // Seeded `false`, never from `check()`: the probe reads a browser global,
  // so seeding it would make the server and client disagree on first render.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    const iv = setInterval(() => {
      if (check()) {
        setReady(true);
        clearInterval(iv);
      }
    }, interval);

    const to = setTimeout(() => clearInterval(iv), timeout);

    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [check, interval, timeout, ready]);

  return ready;
}
