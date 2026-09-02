import type { ApiFormSummary } from '@/lib/api.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';
import { ErrorState } from '@/components/feedback';
import { useDeleteForm } from '@/hooks/use-form-mutations';
import { describeError } from '@/lib/error-messages';

export function DeleteFormDialog(props: {
  organizationId: string;
  form: ApiFormSummary;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeleted: () => void;
}) {
  const remove = useDeleteForm(props.organizationId, props.form.form_id);

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {props.form.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes every branch of this form and all of its conversations.
            Links to the form stop working. This cannot be undone from Studio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? (
          <ErrorState message={describeError(remove.error)} />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault();
              remove.mutate(undefined, {
                onSuccess: () => {
                  props.onDeleted();
                  props.onOpenChange(false);
                },
              });
            }}
          >
            Delete form
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
