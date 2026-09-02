import { useState } from 'react';
import type { ApiForm } from '@/lib/api.types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useCreateBranch } from '@/hooks/use-form-mutations';
import { BRANCH_NAME_HINT, validateBranchName } from '@/lib/branch-name';
import { describeError } from '@/lib/error-messages';

export function CreateBranchDialog(props: {
  organizationId: string;
  form: ApiForm;
  branch: string;
  branches: Array<string>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated: (branch: string) => void;
}) {
  const [name, setName] = useState('');
  const [from, setFrom] = useState(props.branch);
  const [localError, setLocalError] = useState<string | null>(null);
  const create = useCreateBranch(props.organizationId, props.form.form_id);

  const handleCreate = (): void => {
    const trimmed = name.trim();
    const problem = validateBranchName(trimmed);

    if (problem) {
      setLocalError(problem);

      return;
    }

    setLocalError(null);
    create.mutate(
      { from, name: trimmed },
      {
        onSuccess: () => {
          props.onCreated(trimmed);
          props.onOpenChange(false);
          setName('');
        },
      },
    );
  };

  return (
    <Dialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New branch</DialogTitle>
          <DialogDescription>
            A branch copies the schema and the conversation as they are now. It
            does not affect main until you publish.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="branch-name">Branch name</FieldLabel>
          <Input
            id="branch-name"
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder="feature-rating"
            value={name}
          />
          <FieldDescription>{BRANCH_NAME_HINT}</FieldDescription>
          {localError ? <FieldError>{localError}</FieldError> : null}
          {create.isError ? (
            <FieldError>{describeError(create.error)}</FieldError>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="branch-from">Branched from</FieldLabel>
          <Select onValueChange={setFrom} value={from}>
            <SelectTrigger id="branch-from">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" position="popper">
              {props.branches.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <Button
            onClick={() => {
              props.onOpenChange(false);
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={create.isPending} onClick={handleCreate}>
            Create branch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
