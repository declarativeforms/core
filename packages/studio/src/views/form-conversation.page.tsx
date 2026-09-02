import { useState } from 'react';
import type { ApiForm, ApiMessage } from '@/lib/api.types';
import {
  GenerationProgress,
  MessageList,
  PromptComposer,
  SchemaPanel,
} from '@/components';
import { ErrorState } from '@/components/feedback';
import { useMessages } from '@/hooks/use-messages';
import { useSendMessage } from '@/hooks/use-send-message';
import { describeError, isUnknownOutcome } from '@/lib/error-messages';
import { isExpiringSoon } from '@/lib/auth-store';

function buildKey(): string {
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function FormConversation(props: {
  organizationId: string;
  form: ApiForm;
  branch: string;
  isSchemaOpen: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const history = useMessages(
    props.organizationId,
    props.form.form_id,
    props.branch,
  );
  const send = useSendMessage(
    props.organizationId,
    props.form.form_id,
    props.branch,
  );

  const submit = (content: string): void => {
    if (!content.trim()) {
      return;
    }

    if (isExpiringSoon()) {
      setNotice(
        'Your session is about to expire. Reload and sign in again before making a change.',
      );

      return;
    }

    setNotice(null);
    setPendingPrompt(content);
    setDraft('');
    send.mutate(
      { content, idempotencyKey: buildKey() },
      {
        onSuccess: () => {
          setPendingPrompt(null);
        },
        onError: (error: unknown) => {
          setPendingPrompt(null);

          if (isUnknownOutcome(error)) {
            setDraft(content);
          }
        },
      },
    );
  };

  const handleRetry = (message: ApiMessage): void => {
    const index = history.messages.findIndex(
      (entry) => entry.id === message.id,
    );

    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (history.messages[cursor].role === 'user') {
        submit(history.messages[cursor].content);

        return;
      }
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList
        errorMessage={history.errorMessage}
        hasOlder={history.hasOlder}
        isLoading={history.isLoading}
        isLoadingOlder={history.isLoadingOlder}
        isStale={history.isStale}
        messages={history.messages}
        onLoadOlder={history.loadOlder}
        onRetryLoad={history.retry}
        onRetryMessage={send.isPending ? null : handleRetry}
      >
        {pendingPrompt !== null ? (
          <GenerationProgress
            prompt={pendingPrompt}
            startedAt={send.submittedAt}
          />
        ) : null}
      </MessageList>
      <SchemaPanel
        branch={props.branch}
        formId={props.form.form_id}
        isOpen={props.isSchemaOpen}
        organizationId={props.organizationId}
        revision={props.form.revision}
      />
      <div className="border-t border-border p-3">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          {notice ? <ErrorState message={notice} /> : null}
          {send.isError && !isUnknownOutcome(send.error) ? (
            <ErrorState message={describeError(send.error)} />
          ) : null}
          {send.isError && isUnknownOutcome(send.error) ? (
            <ErrorState
              message={describeError(send.error)}
              onRetry={history.retry}
            />
          ) : null}
          <PromptComposer
            isBusy={send.isPending}
            onSubmit={() => {
              submit(draft);
            }}
            onValueChange={setDraft}
            placeholder={`Describe a change to ${props.branch}…`}
            submitLabel="Send message"
            value={draft}
          />
        </div>
      </div>
    </div>
  );
}
