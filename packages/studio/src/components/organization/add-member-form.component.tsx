import { useState } from 'react';
import type { ApiOrganizationRole } from '@/lib/api.types';
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useSaveMember } from '@/hooks/use-member-mutations';
import { describeError } from '@/lib/error-messages';

export function AddMemberForm(props: { organizationId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ApiOrganizationRole>('member');
  const [localError, setLocalError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const save = useSaveMember(props.organizationId);

  const handleAdd = (): void => {
    const normalized = email.trim().toLowerCase();

    if (!normalized.includes('@')) {
      setLocalError('Enter a valid email address.');

      return;
    }

    setLocalError(null);
    save.mutate(
      { email: normalized, role },
      {
        onSuccess: () => {
          setAdded(normalized);
          setEmail('');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Field>
        <FieldLabel htmlFor="member-email">Add a member</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="member-email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="teammate@example.com"
            type="email"
            value={email}
          />
          <Select
            onValueChange={(value: string) => {
              setRole(value as ApiOrganizationRole);
            }}
            value={role}
          >
            <SelectTrigger aria-label="Role" className="w-36 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" position="popper">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={save.isPending || !email.trim()}
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>
        {localError ? <FieldError>{localError}</FieldError> : null}
        {save.isError ? (
          <FieldError>{describeError(save.error)}</FieldError>
        ) : null}
      </Field>
      {added ? (
        <p className="text-xs text-muted-foreground" role="status">
          {added} now has access.
        </p>
      ) : null}
    </div>
  );
}
