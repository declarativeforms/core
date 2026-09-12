import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import type { ApiOrganization, ApiOrganizationRole } from '@/lib/api.types';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/components/ui';
import { RemoveMemberDialog } from '@/components/organization/remove-member-dialog.component';
import { apiRequest } from '@/lib/api-client';
import { membersPath } from '@/lib/api-paths';
import { describeError } from '@/lib/error-messages';

export function OrganizationSettingsDialog(props: {
  organization: ApiOrganization;
  currentEmail: string;
  isAdmin: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRefresh: () => void;
}) {
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ApiOrganizationRole>('member');
  const [localError, setLocalError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (member: { email: string; role: ApiOrganizationRole }) =>
      apiRequest<unknown>({
        body: { email: member.email, role: member.role },
        method: 'POST',
        path: membersPath(props.organization.id),
      }),
    onSuccess: props.onRefresh,
  });
  const adminCount = props.organization.members.filter(
    (member) => member.role === 'admin',
  ).length;

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
    <Dialog onOpenChange={props.onOpenChange} open={props.isOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.organization.name}</DialogTitle>
          <DialogDescription>
            Everyone here can create and edit every form. Admins can also add
            people and delete forms.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            Members ({props.organization.members.length})
          </p>
          <div className="max-h-64 divide-y divide-border overflow-y-auto">
            {props.organization.members.map((member) => {
              const isLastAdmin = member.role === 'admin' && adminCount === 1;

              return (
                <div
                  className="flex items-center gap-2 py-1.5"
                  key={member.email}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {member.email}
                    {member.email === props.currentEmail ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        You
                      </span>
                    ) : null}
                  </span>
                  {props.isAdmin ? (
                    <Select
                      disabled={isLastAdmin}
                      onValueChange={(nextRole: string) => {
                        save.mutate({
                          email: member.email,
                          role: nextRole as ApiOrganizationRole,
                        });
                      }}
                      value={member.role}
                    >
                      <SelectTrigger
                        aria-label={`Role for ${member.email}`}
                        className="w-36 shrink-0"
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start" position="popper">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={
                        member.role === 'admin' ? 'default' : 'secondary'
                      }
                    >
                      {member.role === 'admin' ? 'Admin' : 'Member'}
                    </Badge>
                  )}
                  {props.isAdmin ? (
                    <Button
                      aria-label={`Remove ${member.email}`}
                      disabled={isLastAdmin}
                      onClick={() => {
                        setPendingRemoval(member.email);
                      }}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {adminCount === 1 ? (
            <p className="text-xs text-muted-foreground">
              An organization must keep at least one admin.
            </p>
          ) : null}
        </div>
        {props.isAdmin ? (
          <>
            <Separator />
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
                    onValueChange={(nextRole: string) => {
                      setRole(nextRole as ApiOrganizationRole);
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
          </>
        ) : null}
        {pendingRemoval ? (
          <RemoveMemberDialog
            email={pendingRemoval}
            isOpen
            onOpenChange={(isOpen: boolean) => {
              if (!isOpen) {
                setPendingRemoval(null);
              }
            }}
            onRefresh={props.onRefresh}
            organizationId={props.organization.id}
            organizationName={props.organization.name}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
