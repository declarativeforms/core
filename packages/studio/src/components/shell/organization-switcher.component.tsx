import { Building2, Check, ChevronsUpDown, Settings } from 'lucide-react';
import type { ApiOrganization } from '@/lib/api.types';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

export function OrganizationSwitcher(props: {
  organizations: Array<ApiOrganization>;
  organizationId: string | null;
  onSelect: (organizationId: string) => void;
  onOpenSettings: () => void;
}) {
  const active = props.organizations.find(
    (entry) => entry.id === props.organizationId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full justify-between" size="sm" variant="outline">
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="shrink-0" />
            <span className="truncate">
              {active ? active.name : 'Workspace'}
            </span>
          </span>
          <ChevronsUpDown className="shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {props.organizations.map((organization) => (
          <DropdownMenuItem
            key={organization.id}
            onSelect={() => {
              props.onSelect(organization.id);
            }}
          >
            <span className="truncate">{organization.name}</span>
            {organization.id === props.organizationId ? (
              <Check className="ml-auto size-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={props.onOpenSettings}>
          <Settings className="size-4" />
          Organization settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
