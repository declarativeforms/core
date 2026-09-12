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
import { publishPath } from '@/lib/api-paths';
import { describeError } from '@/lib/error-messages';
import { DEFAULT_BRANCH } from '@/lib/preview-url';

export function PublishDialog(props: {
  organizationId: string;
  form: ApiForm;
  branch: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPublished: () => void;
  onRefresh: () => void;
}) {
  const publish = useMutation({
    mutationFn: (branch: string) =>
      apiRequest<unknown>({
        method: 'POST',
        path: publishPath(props.organizationId, props.form.form_id, branch),
      }),
    onSuccess: props.onRefresh,
  });

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Publish {props.branch} to {DEFAULT_BRANCH}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This updates the form hosted in Studio. {DEFAULT_BRANCH} is replaced
            by {props.branch}. The branch and both conversation histories stay
            separate, and the published form is live for anyone with the link.
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
