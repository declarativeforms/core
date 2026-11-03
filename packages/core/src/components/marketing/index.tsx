import type { ReactNode } from 'react';
import { mergeClassNames } from '@/lib/utils';

export const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap';

const BUTTON_VARIANT_CLASS: Record<string, string> = {
  primary: 'bg-brand-yellow',
  secondary: 'bg-white',
};

const BUTTON_SIZE_CLASS: Record<string, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function ActionButton(props: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
}): React.JSX.Element {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';

  return (
    <a
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 rounded-md border-2 border-ink font-semibold text-ink shadow-hard transition-all duration-150',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
        'active:translate-x-0 active:translate-y-0 active:shadow-hard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        BUTTON_VARIANT_CLASS[variant],
        BUTTON_SIZE_CLASS[size],
      )}
      href={props.href}
      rel="noreferrer"
    >
      {props.children}
    </a>
  );
}

export function BrandMark(): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        alt=""
        className="size-8 rounded-md border-2 border-ink"
        src="/android-chrome-192x192.png"
      />
      <span className="font-display text-lg font-semibold tracking-[-0.02em]">
        Declarative Forms
      </span>
    </span>
  );
}

export { McpEndpoint } from './mcp-endpoint';
