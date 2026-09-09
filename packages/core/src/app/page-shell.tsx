import type { ReactNode } from 'react';

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
