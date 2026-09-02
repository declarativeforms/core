import type { ApiMessage } from '@/lib/api.types';
import { Badge, Button } from '@/components/ui';
import { formatAbsolute, formatMessageTime } from '@/lib/time';

export function MessageItem(props: {
  message: ApiMessage;
  showTimestamp: boolean;
  onRetry: (() => void) | null;
}) {
  if (props.message.role === 'system') {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <p
          className="text-xs text-muted-foreground"
          title={formatAbsolute(props.message.created_at)}
        >
          {props.message.content}
        </p>
      </div>
    );
  }

  const isUser = props.message.role === 'user';
  const isFailed = props.message.status === 'failed';

  return (
    <div
      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
    >
      {props.showTimestamp ? (
        <span
          className="px-1 text-[0.6875rem] text-muted-foreground"
          title={formatAbsolute(props.message.created_at)}
        >
          {formatMessageTime(props.message.created_at)}
        </span>
      ) : null}
      <div
        className={`max-w-[46rem] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : isFailed
              ? 'border-l-2 border-destructive/60 bg-muted text-foreground'
              : 'bg-muted text-foreground'
        }`}
      >
        {props.message.content}
      </div>
      <div className="flex items-center gap-2 px-1">
        {props.message.origin_branch ? (
          <Badge variant="secondary">from {props.message.origin_branch}</Badge>
        ) : null}
        {isFailed && props.onRetry ? (
          <Button onClick={props.onRetry} size="sm" variant="outline">
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
