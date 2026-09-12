import {
  Building2,
  Check,
  ChevronsUpDown,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import type { ApiForm, ApiOrganization } from '@/lib/api.types';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
} from '@/components/ui';
import { EmptyState, SkeletonRows, StaleNotice } from '@/components/feedback';
import { BrandMark } from '@/components/shell/brand-mark.component';
import { formatAbsolute } from '@/lib/time';

export function AppSidebar(props: {
  organizations: Array<ApiOrganization>;
  organizationId: string | null;
  email: string;
  forms: Array<ApiForm>;
  activeFormId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isStale: boolean;
  onRetry: () => void;
  onSelectOrganization: (organizationId: string) => void;
  onSelectForm: (formId: string) => void;
  onNewForm: () => void;
  onRenameForm: (form: ApiForm) => void;
  onDeleteForm: (form: ApiForm) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const organization = props.organizations.find(
    (entry) => entry.id === props.organizationId,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <BrandMark className="px-1 pt-1" showWordmark />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-full justify-between"
            size="sm"
            variant="outline"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="shrink-0" />
              <span className="truncate">
                {organization ? organization.name : 'Organization'}
              </span>
            </span>
            <ChevronsUpDown className="shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {props.organizations.map((entry) => (
            <DropdownMenuItem
              key={entry.id}
              onSelect={() => {
                props.onSelectOrganization(entry.id);
              }}
            >
              <span className="truncate">{entry.name}</span>
              {entry.id === props.organizationId ? (
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
      <Button onClick={props.onNewForm} size="sm">
        <Plus />
        New form
      </Button>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {props.isLoading ? <SkeletonRows count={5} className="px-1" /> : null}
        {!props.isLoading && props.forms.length === 0 ? (
          <EmptyState
            description="Select New form to create your first one."
            title="No forms yet"
          />
        ) : null}
        {!props.isLoading && props.forms.length > 0 ? (
          <div className="flex flex-col gap-1">
            {props.isStale ? <StaleNotice onRetry={props.onRetry} /> : null}
            {props.forms.map((form) => {
              const isActive = form.form_id === props.activeFormId;

              return (
                <div
                  className={`group flex items-center gap-1 rounded-md pr-1 ${
                    isActive ? 'bg-muted' : 'hover:bg-muted/60'
                  }`}
                  key={form.form_id}
                >
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className="min-w-0 flex-1 px-2 py-2 text-left text-sm"
                    onClick={() => {
                      props.onSelectForm(form.form_id);
                    }}
                    title={`Updated ${formatAbsolute(form.updated_at)}`}
                    type="button"
                  >
                    <span className="block truncate">{form.name}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`Actions for ${form.name}`}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100 data-[state=open]:opacity-100"
                        size="icon-sm"
                        variant="ghost"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          props.onRenameForm(form);
                        }}
                      >
                        <Pencil className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      {props.isAdmin ? (
                        <DropdownMenuItem
                          onSelect={() => {
                            props.onDeleteForm(form);
                          }}
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Delete form
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <Separator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-start" size="sm" variant="ghost">
            <User className="shrink-0" />
            <span className="truncate">{props.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={props.onOpenSettings}>
            <Settings className="size-4" />
            Organization settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={props.onSignOut}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
