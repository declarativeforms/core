import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import type { ApiMessage } from '@/lib/api.types';
import { EmptyState } from '@/components/feedback';
import { formatAbsolute, formatMessageTime, minutesBetween } from '@/lib/time';

const TIMESTAMP_GAP_MINUTES = 5;
const STICK_THRESHOLD_PX = 80;

function renderAssistantMessage(content: string): ReactNode {
  return content.split(/(https?:\/\/[^\s<>"'`]+)/gi).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) {
      return part;
    }

    const href = part.replace(/[.,!?;:)\]}]+$/, '');

    try {
      new URL(href);
    } catch {
      return part;
    }

    return (
      <Fragment key={index}>
        <a
          className="underline underline-offset-2 hover:text-muted-foreground"
          href={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          {href}
        </a>
        {part.slice(href.length)}
      </Fragment>
    );
  });
}

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
  children?: ReactNode;
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

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4">
        {count === 0 && !props.children ? (
          <EmptyState
            description="Ask a question, explore an improvement, or describe a change to this form."
            title="No messages on this branch yet"
          />
        ) : null}
        {props.messages.map((message, index) => {
          if (message.role === 'system') {
            return (
              <div
                className="flex flex-col items-center gap-1 py-2"
                key={message.id}
              >
                <p
                  className="text-xs text-muted-foreground"
                  title={formatAbsolute(message.created_at)}
                >
                  {message.content}
                </p>
              </div>
            );
          }

          const isUser = message.role === 'user';

          return (
            <div
              className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
              key={message.id}
            >
              {shouldShowTimestamp(props.messages, index) ? (
                <span
                  className="px-1 text-[0.6875rem] text-muted-foreground"
                  title={formatAbsolute(message.created_at)}
                >
                  {formatMessageTime(message.created_at)}
                </span>
              ) : null}
              <div
                className={`max-w-[46rem] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {isUser
                  ? message.content
                  : renderAssistantMessage(message.content)}
              </div>
            </div>
          );
        })}
        {props.children}
      </div>
    </div>
  );
}
