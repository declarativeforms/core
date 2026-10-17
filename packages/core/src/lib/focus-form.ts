'use client';

export function focusForm(form: HTMLFormElement | null): () => void {
  const viewport = window.visualViewport;
  const interactions = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
  let frame = window.requestAnimationFrame(() => {
    form?.focus({ preventScroll: true });
    scrollToTop();
    viewport?.addEventListener('resize', scheduleScroll);
  });
  const timeout = window.setTimeout(() => {
    scrollToTop();
    cancel();
  }, 500);

  function scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function scheduleScroll(): void {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(scrollToTop);
  }

  function cancel(): void {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
    viewport?.removeEventListener('resize', scheduleScroll);

    for (const interaction of interactions) {
      window.removeEventListener(interaction, cancel);
    }
  }

  for (const interaction of interactions) {
    window.addEventListener(interaction, cancel, { passive: true });
  }

  return cancel;
}
