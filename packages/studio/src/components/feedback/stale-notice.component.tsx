import { Button } from '@/components/ui';

export function StaleNotice(props: { onRetry: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/50 px-3 py-2"
      role="status"
    >
      <p className="text-xs text-muted-foreground">
        Showing the last loaded data. The latest refresh did not reach the
        server.
      </p>
      <Button onClick={props.onRetry} size="sm" variant="ghost">
        Retry
      </Button>
    </div>
  );
}
