import {
  ExamplePrompts,
  GenerationProgress,
  PromptComposer,
} from '@/components';
import { ErrorState } from '@/components/feedback';
import { useGenerateForm } from '@/hooks/use-generate-form';
import { useNewFormDraft } from '@/hooks/use-new-form-draft';
import { describeError } from '@/lib/error-messages';

export function NewForm(props: {
  organizationId: string;
  onCreated: (formId: string, branch: string) => void;
}) {
  const draft = useNewFormDraft(props.organizationId);
  const generate = useGenerateForm(props.organizationId);

  const handleSubmit = (): void => {
    const prompt = draft.value.trim();

    if (!prompt) {
      return;
    }

    generate.mutate(prompt, {
      onSuccess: (messages) => {
        const created = messages[0];

        if (!created) {
          return;
        }

        draft.clear();
        props.onCreated(created.form_id, created.branch);
      },
    });
  };

  if (generate.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 p-6">
        <GenerationProgress
          prompt={draft.value}
          startedAt={generate.submittedAt}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-medium">What do you want to collect?</h1>
        <p className="text-sm text-muted-foreground">
          Describe the form in plain language. Studio writes the schema,
          validates it and saves it.
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
        onValueChange={draft.setValue}
        placeholder="A customer feedback form with a rating and a comment…"
        submitLabel="Create form"
        value={draft.value}
      />
      <ExamplePrompts onPick={draft.setValue} />
    </div>
  );
}
