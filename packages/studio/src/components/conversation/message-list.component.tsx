import { useEffect, useRef } from 'react';
import type { ApiMessage } from '@/lib/api.types';
import { Button } from '@/components/ui';
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
  StaleNotice,
} from '@/components/feedback';
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
  isStale: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  errorMessage: string | null;
  onLoadOlder: () => void;
  onRetryLoad: () => void;
  onRetryMessage: ((message: ApiMessage) => void) | null;
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
        {props.isStale ? <StaleNotice onRetry={props.onRetryLoad} /> : null}
        {props.hasOlder ? (
          <Button
            className="self-center"
            disabled={props.isLoadingOlder}
            onClick={props.onLoadOlder}
            size="sm"
            variant="ghost"
          >
            {props.isLoadingOlder ? 'Loading…' : 'Load earlier messages'}
          </Button>
        ) : null}
        {count === 0 && !props.children ? (
          <EmptyState
            description="Describe a change below and it will be applied to this branch."
            title="No messages on this branch yet"
          />
        ) : null}
        {props.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            onRetry={
              props.onRetryMessage
                ? () => {
                    if (props.onRetryMessage) {
                      props.onRetryMessage(message);
                    }
                  }
                : null
            }
            showTimestamp={shouldShowTimestamp(props.messages, index)}
          />
        ))}
        {props.children}
      </div>
    </div>
  );
}
