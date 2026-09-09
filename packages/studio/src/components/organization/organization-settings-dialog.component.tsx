import { useState } from 'react';
import type { ApiOrganization, ApiOrganizationRole } from '@/lib/api.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/components/ui';
import { AddMemberForm } from '@/components/organization/add-member-form.component';
import { MemberRow } from '@/components/organization/member-row.component';
import { RemoveMemberDialog } from '@/components/organization/remove-member-dialog.component';
import { useSaveMember } from '@/hooks/use-member-mutations';

export function OrganizationSettingsDialog(props: {
  organization: ApiOrganization;
  currentEmail: string;
  isAdmin: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const save = useSaveMember(props.organization.id);
  const adminCount = props.organization.members.filter(
    (member) => member.role === 'admin',
  ).length;

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
            {props.organization.members.map((member) => (
              <MemberRow
                canManage={props.isAdmin}
                isCurrentUser={member.email === props.currentEmail}
                isLastAdmin={member.role === 'admin' && adminCount === 1}
                key={member.email}
                member={member}
                onChangeRole={(role: ApiOrganizationRole) => {
                  save.mutate({ email: member.email, role });
                }}
                onRemove={() => {
                  setPendingRemoval(member.email);
                }}
              />
            ))}
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
            <AddMemberForm organizationId={props.organization.id} />
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
            organizationId={props.organization.id}
            organizationName={props.organization.name}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
