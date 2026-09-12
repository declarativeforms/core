import { useMutation } from '@tanstack/react-query';
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
import { memberPath } from '@/lib/api-paths';
import { describeError } from '@/lib/error-messages';

export function RemoveMemberDialog(props: {
  organizationId: string;
  organizationName: string;
  email: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRefresh: () => void;
}) {
  const remove = useMutation({
    mutationFn: (email: string) =>
      apiRequest<unknown>({
        method: 'DELETE',
        path: memberPath(props.organizationId, email),
      }),
    onSuccess: props.onRefresh,
  });

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {props.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            They lose access to every form in {props.organizationName}. Anything
            they created stays, and you can add them again at any time.
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
              remove.mutate(props.email, {
                onSuccess: () => {
                  props.onOpenChange(false);
                },
              });
            }}
          >
            Remove member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
