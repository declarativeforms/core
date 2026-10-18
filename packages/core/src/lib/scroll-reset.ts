export function resetWindowScroll(): () => void {
  const controller = new AbortController();
  const listenerOptions = {
    capture: true,
    passive: true,
    signal: controller.signal,
  };
  const timeout = setTimeout(stopResettingScroll, 500);

  function stopResettingScroll(): void {
    clearTimeout(timeout);
    controller.abort();
  }

  function correctScroll(): void {
    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    }
  }

  window.addEventListener('scroll', correctScroll, listenerOptions);
  for (const event of [
    'pointerdown',
    'touchstart',
    'wheel',
    'keydown',
    'focusin',
  ]) {
    window.addEventListener(event, stopResettingScroll, listenerOptions);
  }
  window.scrollTo({ left: 0, top: 0, behavior: 'instant' });

  return stopResettingScroll;
}
