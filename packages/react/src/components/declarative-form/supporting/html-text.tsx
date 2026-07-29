import type { ComponentPropsWithoutRef, ElementType } from 'react';

/** @deprecated Use PlainText. Authored text is escaped and HTML is not rendered. */
export function HtmlText<T extends ElementType = 'span'>({
  html,
  as,
  ...rest
}: {
  html: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'children'>) {
  const Tag = as || 'span';
  return <Tag {...rest}>{html}</Tag>;
}
