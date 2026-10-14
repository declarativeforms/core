import { mergeClassNames } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="skeleton"
      className={mergeClassNames(
        'animate-pulse rounded-md bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
