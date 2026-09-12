import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  ErrorState,
  GenerationProgress,
  PromptComposer,
} from '@/components';
import { apiRequest } from '@/lib/api-client';
import { generatePath } from '@/lib/api-paths';
import type { ApiMessage } from '@/lib/api.types';
import { readDraft, writeDraft } from '@/lib/draft-store';
import { describeError } from '@/lib/error-messages';

const GENERATION_TIMEOUT_MS = 120_000;
const EXAMPLES: Array<string> = [
  'A customer feedback form with a 1 to 5 rating and an optional comment',
  'An event registration form: name, email, dietary requirements, number of guests',
  'A bug report form with severity, steps to reproduce and a screenshot upload',
  'A job application form with a CV upload and a work-authorisation question',
];

export function NewForm(props: {
  organizationId: string;
  onCreated: (formId: string, branch: string) => void;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState(() => readDraft(props.organizationId));
  const generate = useMutation({
    mutationFn: (prompt: string) =>
      apiRequest<Array<ApiMessage>>({
        body: { prompt },
        method: 'POST',
        path: generatePath(props.organizationId),
        timeoutMs: GENERATION_TIMEOUT_MS,
      }),
    onSuccess: props.onRefresh,
  });

  const handleSubmit = (): void => {
    const prompt = draft.trim();

    if (!prompt) {
      return;
    }

    generate.mutate(prompt, {
      onSuccess: (messages) => {
        const created = messages[0];

        if (!created) {
          return;
        }

        setDraft('');
        writeDraft(props.organizationId, '');
        props.onCreated(created.form_id, created.branch);
      },
    });
  };

  if (generate.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 p-6">
        <GenerationProgress prompt={draft} startedAt={generate.submittedAt} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-medium">What do you want to collect?</h1>
        <p className="text-sm text-muted-foreground">
          Describe what you want to collect and who will fill it in. Studio
          creates a first version with a preview link, then helps you refine it
          in chat. Include where completed responses should go, such as an email
          address.
        </p>
      </div>
      {generate.isError ? (
        <ErrorState
          message={describeError(generate.error)}
          onRetry={handleSubmit}
        />
      ) : null}
      <PromptComposer
        isBusy={false}
        onSubmit={handleSubmit}
        onValueChange={(value: string) => {
          setDraft(value);
          writeDraft(props.organizationId, value);
        }}
        placeholder="A customer feedback form with a rating and a comment…"
        submitLabel="Create form"
        value={draft}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {EXAMPLES.map((example) => (
          <button
            className="rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            key={example}
            onClick={() => {
              setDraft(example);
              writeDraft(props.organizationId, example);
            }}
            type="button"
          >
            <Card className="h-full cursor-pointer transition-colors hover:bg-muted/60">
              <CardContent className="px-3 py-2">
                <p className="text-sm text-muted-foreground">{example}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
