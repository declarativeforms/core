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
import { useRemoveMember } from '@/hooks/use-member-mutations';
import { describeError } from '@/lib/error-messages';

export function RemoveMemberDialog(props: {
  organizationId: string;
  organizationName: string;
  email: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const remove = useRemoveMember(props.organizationId);

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {props.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            They lose access to every form in {props.organizationName}. Forms
            and conversations they created stay. You can add them again at any
            time.
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
