import { Skeleton } from '@/components/ui';

export function SkeletonRows(props: { count: number; className?: string }) {
  const rows: Array<number> = [];

  for (let index = 0; index < props.count; index += 1) {
    rows.push(index);
  }

  return (
    <div className={`flex flex-col gap-2 ${props.className ?? ''}`}>
      {rows.map((row) => (
        <Skeleton className="h-9 w-full" key={row} />
      ))}
    </div>
  );
}
