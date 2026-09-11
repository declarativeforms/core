import type { ReactNode } from 'react';

export function PageShell(props: {
  embed?: boolean;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <main
      id="main-content"
      className={props.embed ? 'min-h-lvh bg-white' : undefined}
    >
      {props.children}
    </main>
  );
}
