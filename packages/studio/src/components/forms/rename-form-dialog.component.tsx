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
  FieldError,
  FieldLabel,
  Input,
} from '@/components/ui';
import { useRenameForm } from '@/hooks/use-form-mutations';
import { describeError } from '@/lib/error-messages';

export function RenameFormDialog(props: {
  organizationId: string;
  form: ApiForm;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [name, setName] = useState(props.form.name);
  const rename = useRenameForm(props.organizationId, props.form.form_id);
  const trimmed = name.trim();

  const handleSave = (): void => {
    rename.mutate(trimmed, {
      onSuccess: () => {
        props.onOpenChange(false);
      },
    });
  };

  return (
    <Dialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename form</DialogTitle>
          <DialogDescription>
            This is the name in Studio. The title on the form itself does not
            change.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="form-name">Name</FieldLabel>
          <Input
            id="form-name"
            maxLength={120}
            onChange={(event) => {
              setName(event.target.value);
            }}
            value={name}
          />
          {rename.isError ? (
            <FieldError>{describeError(rename.error)}</FieldError>
          ) : null}
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
          <Button
            disabled={
              rename.isPending || !trimmed || trimmed === props.form.name
            }
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
