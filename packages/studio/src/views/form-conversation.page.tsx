import { useState } from 'react';
import type { ApiForm } from '@/lib/api.types';
import {
  GenerationProgress,
  MessageList,
  PromptComposer,
  SchemaPanel,
} from '@/components';
import { ErrorState } from '@/components/feedback';
import { useMessages } from '@/hooks/use-messages';
import { useSendMessage } from '@/hooks/use-send-message';
import { describeError } from '@/lib/error-messages';
import { isExpiringSoon } from '@/lib/auth-store';
import { isDraftBranch } from '@/lib/preview-url';

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
    send.mutate(content, {
      onSuccess: () => {
        setPendingPrompt(null);
      },
      onError: () => {
        setPendingPrompt(null);
        setDraft(content);
      },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList
        errorMessage={history.errorMessage}
        isLoading={history.isLoading}
        messages={history.messages}
        onRetryLoad={history.retry}
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
      />
      <div className="border-t border-border p-3">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          {notice ? <ErrorState message={notice} /> : null}
          {send.isError ? (
            <ErrorState message={describeError(send.error)} />
          ) : null}
          <PromptComposer
            isBusy={send.isPending}
            onSubmit={() => {
              submit(draft);
            }}
            onValueChange={setDraft}
            placeholder="Ask a question or describe a change…"
            submitLabel="Send message"
            value={draft}
          />
          <p className="text-xs text-muted-foreground">
            {isDraftBranch(props.branch)
              ? `Requested changes update the ${props.branch} draft immediately. Publish replaces main with this draft.`
              : 'Requested changes update your main form immediately. Use New branch to work on a separate draft.'}
          </p>
        </div>
      </div>
    </div>
  );
}
