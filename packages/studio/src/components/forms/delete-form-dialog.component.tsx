import { useMutation } from '@tanstack/react-query';
import type { ApiForm } from '@/lib/api.types';
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
import { apiRequest } from '@/lib/api-client';
import { formPath } from '@/lib/api-paths';
import { describeError } from '@/lib/error-messages';

export function DeleteFormDialog(props: {
  organizationId: string;
  form: ApiForm;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeleted: () => void;
  onRefresh: () => void;
}) {
  const remove = useMutation({
    mutationFn: () =>
      apiRequest<unknown>({
        method: 'DELETE',
        path: formPath(props.organizationId, props.form.form_id),
      }),
    onSuccess: props.onRefresh,
  });

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {props.form.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Every branch and conversation goes with it, and links to this form
            stop working. This cannot be undone from Studio.
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
