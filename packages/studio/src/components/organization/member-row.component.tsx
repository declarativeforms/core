import { Trash2 } from 'lucide-react';
import type {
  ApiOrganizationMember,
  ApiOrganizationRole,
} from '@/lib/api.types';
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

export function MemberRow(props: {
  member: ApiOrganizationMember;
  isCurrentUser: boolean;
  canManage: boolean;
  isLastAdmin: boolean;
  onChangeRole: (role: ApiOrganizationRole) => void;
  onRemove: () => void;
}) {
  const isLocked = props.isLastAdmin;

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm">
        {props.member.email}
        {props.isCurrentUser ? (
          <span className="ml-2 text-xs text-muted-foreground">You</span>
        ) : null}
      </span>
      {props.canManage ? (
        <Select
          disabled={isLocked}
          onValueChange={(value: string) => {
            props.onChangeRole(value as ApiOrganizationRole);
          }}
          value={props.member.role}
        >
          <SelectTrigger
            aria-label={`Role for ${props.member.email}`}
            className="w-[7.5rem]"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Badge
          variant={props.member.role === 'admin' ? 'default' : 'secondary'}
        >
          {props.member.role === 'admin' ? 'Admin' : 'Member'}
        </Badge>
      )}
      {props.canManage ? (
        <Button
          aria-label={`Remove ${props.member.email}`}
          disabled={isLocked}
          onClick={props.onRemove}
          size="icon-sm"
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
