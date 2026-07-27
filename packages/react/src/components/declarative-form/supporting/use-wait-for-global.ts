import { useEffect, useState } from 'react';

export function useWaitForGlobal(
  check: () => boolean,
  { interval = 100, timeout = 10_000 } = {},
): boolean {
  const [ready, setReady] = useState(check);

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
