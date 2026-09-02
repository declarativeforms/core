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
import { usePublishBranch } from '@/hooks/use-form-mutations';
import { describeError } from '@/lib/error-messages';
import { DEFAULT_BRANCH } from '@/lib/preview-url';

export function PublishDialog(props: {
  organizationId: string;
  form: ApiFormSummary;
  branch: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPublished: () => void;
}) {
  const publish = usePublishBranch(props.organizationId, props.form.form_id);

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Publish {props.branch} to {DEFAULT_BRANCH}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This replaces the {DEFAULT_BRANCH} schema with the current{' '}
            {props.branch} schema, and copies the {props.branch} messages
            created since the branch was made into the {DEFAULT_BRANCH}{' '}
            conversation. {props.branch} stays available. The published form is
            live for anyone with the link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {publish.isError ? (
          <ErrorState message={describeError(publish.error)} />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={publish.isPending}
            onClick={(event) => {
              event.preventDefault();
              publish.mutate(props.branch, {
                onSuccess: () => {
                  props.onPublished();
                  props.onOpenChange(false);
                },
              });
            }}
          >
            Publish to {DEFAULT_BRANCH}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
