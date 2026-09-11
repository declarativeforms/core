import { useEffect, useRef } from 'react';
import type { ApiMessage } from '@/lib/api.types';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/feedback';
import { MessageItem } from '@/components/conversation/message-item.component';
import { minutesBetween } from '@/lib/time';

const TIMESTAMP_GAP_MINUTES = 5;
const STICK_THRESHOLD_PX = 80;

function shouldShowTimestamp(
  messages: Array<ApiMessage>,
  index: number,
): boolean {
  if (index === 0) {
    return true;
  }

  const previous = messages[index - 1];
  const current = messages[index];

  if (previous.role !== current.role) {
    return true;
  }

  return (
    minutesBetween(previous.created_at, current.created_at) >
    TIMESTAMP_GAP_MINUTES
  );
}

export function MessageList(props: {
  messages: Array<ApiMessage>;
  isLoading: boolean;
  errorMessage: string | null;
  onRetryLoad: () => void;
  children?: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = props.messages.length;

  useEffect(() => {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;

    if (distance > STICK_THRESHOLD_PX) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [count, props.children]);

  if (props.isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (props.errorMessage) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <ErrorState message={props.errorMessage} onRetry={props.onRetryLoad} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4">
        {count === 0 && !props.children ? (
          <EmptyState
            description="Ask a question, explore an improvement, or describe a change to this form."
            title="No messages on this branch yet"
          />
        ) : null}
        {props.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            showTimestamp={shouldShowTimestamp(props.messages, index)}
          />
        ))}
        {props.children}
      </div>
    </div>
  );
}
