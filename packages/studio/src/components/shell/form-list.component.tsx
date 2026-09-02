import type { ApiForm } from '@/lib/api.types';
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
  StaleNotice,
} from '@/components/feedback';
import { FormListRow } from '@/components/shell/form-list-row.component';

export function FormList(props: {
  forms: Array<ApiForm>;
  activeFormId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isStale: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onSelect: (formId: string) => void;
  onRename: (form: ApiForm) => void;
  onDelete: (form: ApiForm) => void;
}) {
  if (props.isLoading) {
    return <SkeletonRows count={5} className="px-1" />;
  }

  if (props.errorMessage) {
    return <ErrorState message={props.errorMessage} onRetry={props.onRetry} />;
  }

  if (props.forms.length === 0) {
    return (
      <EmptyState
        description="Describe one in the composer to get started."
        title="No forms yet"
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {props.isStale ? <StaleNotice onRetry={props.onRetry} /> : null}
      {props.forms.map((form) => (
        <FormListRow
          form={form}
          isActive={form.form_id === props.activeFormId}
          isAdmin={props.isAdmin}
          key={form.form_id}
          onDelete={() => {
            props.onDelete(form);
          }}
          onRename={() => {
            props.onRename(form);
          }}
          onSelect={() => {
            props.onSelect(form.form_id);
          }}
        />
      ))}
    </div>
  );
}
