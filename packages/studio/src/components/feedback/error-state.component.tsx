import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export function ErrorState(props: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 ${props.className ?? ''}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">{props.message}</p>
      </div>
      {props.onRetry ? (
        <Button onClick={props.onRetry} size="sm" variant="outline">
          Retry
        </Button>
      ) : null}
    </div>
  );
}
