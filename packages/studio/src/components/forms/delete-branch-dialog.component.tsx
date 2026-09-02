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
import { useDeleteBranch } from '@/hooks/use-form-mutations';
import { describeError } from '@/lib/error-messages';
import { DEFAULT_BRANCH } from '@/lib/preview-url';

export function DeleteBranchDialog(props: {
  organizationId: string;
  form: ApiFormSummary;
  branch: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeleted: () => void;
}) {
  const remove = useDeleteBranch(props.organizationId, props.form.form_id);

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete branch {props.branch}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the {props.branch} schema and its conversation.{' '}
            {DEFAULT_BRANCH} is not affected. This cannot be undone.
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
              remove.mutate(props.branch, {
                onSuccess: () => {
                  props.onDeleted();
                  props.onOpenChange(false);
                },
              });
            }}
          >
            Delete branch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
