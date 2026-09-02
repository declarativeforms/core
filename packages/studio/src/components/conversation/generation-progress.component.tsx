import { Loader2 } from 'lucide-react';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';

export function GenerationProgress(props: {
  startedAt: number;
  prompt: string;
}) {
  const elapsed = useElapsedSeconds(props.startedAt);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="max-w-[46rem] rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-wrap break-words text-primary-foreground">
          {props.prompt}
        </div>
      </div>
      <div className="flex flex-col items-start gap-1">
        <div className="flex max-w-[46rem] items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span aria-live="polite">Generating… {elapsed}s</span>
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          This usually takes 20 to 60 seconds. The change is applied
          automatically when it finishes.
          {elapsed >= 45 ? ' Still working.' : ''}
        </p>
      </div>
    </div>
  );
}
