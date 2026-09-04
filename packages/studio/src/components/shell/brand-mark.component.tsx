import { cn } from '@/lib/utils';

export function BrandMark(props: {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'lg';
}) {
  const isLarge = props.size === 'lg';

  return (
    <span className={cn('flex items-center gap-2', props.className)}>
      <img
        alt=""
        className={isLarge ? 'size-9 rounded-md' : 'size-6 rounded'}
        height={isLarge ? 36 : 24}
        src="/android-chrome-192x192.png"
        width={isLarge ? 36 : 24}
      />
      {props.showWordmark ? (
        <span
          className={cn(
            'font-medium tracking-tight text-foreground',
            isLarge ? 'text-base' : 'text-sm',
          )}
        >
          Studio
        </span>
      ) : null}
    </span>
  );
}
