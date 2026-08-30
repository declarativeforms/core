import type { ReactNode } from 'react';

/**
 * The `<main>` wrapper that used to live in `App.tsx`.
 *
 * It lives in the pages rather than the layout because layouts do not receive
 * `searchParams`, and the embed variant has to be correct in the first byte of
 * HTML rather than flipping after hydration.
 */
export function PageShell(props: { embed?: boolean; children: ReactNode }) {
  return (
    <main
      id="main-content"
      className={props.embed ? 'min-h-lvh bg-white' : undefined}
    >
      {props.children}
    </main>
  );
}
