import { useEffect, useState } from 'react';

export function useWaitForGlobal(
  check: () => boolean,
  { interval = 100, timeout = 10_000 } = {},
): boolean {
  const [ready, setReady] = useState(check);

  useEffect(() => {
    if (ready) return;

    const checkForGlobal = () => {
      if (check()) {
        setReady(true);
      }
    };
    let poll = setInterval(checkForGlobal, interval);

    const slowDown = setTimeout(() => {
      clearInterval(poll);
      poll = setInterval(checkForGlobal, Math.max(interval, 1_000));
    }, timeout);

    return () => {
      clearInterval(poll);
      clearTimeout(slowDown);
    };
  }, [check, interval, timeout, ready]);

  return ready;
}
