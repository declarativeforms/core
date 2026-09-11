import { Fragment, type ReactNode } from 'react';
import type { ApiMessage } from '@/lib/api.types';
import { formatAbsolute, formatMessageTime } from '@/lib/time';

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

export function MessageItem(props: {
  message: ApiMessage;
  showTimestamp: boolean;
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
            : 'bg-muted text-foreground'
        }`}
      >
        {isUser
          ? props.message.content
          : renderAssistantMessage(props.message.content)}
      </div>
    </div>
  );
}
