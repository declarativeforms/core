import type { ComponentPropsWithoutRef, ElementType } from 'react';

type PlainTextProps<T extends ElementType = 'span'> = {
  text: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'dangerouslySetInnerHTML' | 'children'>;

export function PlainText<T extends ElementType = 'span'>({
  text,
  as,
  ...rest
}: PlainTextProps<T>) {
  const Tag = as || 'span';
  return <Tag {...rest}>{text}</Tag>;
}
