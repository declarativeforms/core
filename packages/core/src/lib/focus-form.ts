'use client';

export function focusForm(form: HTMLFormElement | null): () => void {
  const frame = window.requestAnimationFrame(() => {
    form?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });

  return () => window.cancelAnimationFrame(frame);
}
