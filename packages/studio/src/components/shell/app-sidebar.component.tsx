import { Plus } from 'lucide-react';
import type { ApiForm, ApiOrganization } from '@/lib/api.types';
import { Button, Separator } from '@/components/ui';
import { AccountMenu } from '@/components/shell/account-menu.component';
import { BrandMark } from '@/components/shell/brand-mark.component';
import { FormList } from '@/components/shell/form-list.component';
import { OrganizationSwitcher } from '@/components/shell/organization-switcher.component';

export function AppSidebar(props: {
  organizations: Array<ApiOrganization>;
  organizationId: string | null;
  email: string;
  forms: Array<ApiForm>;
  activeFormId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isStale: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onSelectOrganization: (organizationId: string) => void;
  onSelectForm: (formId: string) => void;
  onNewForm: () => void;
  onRenameForm: (form: ApiForm) => void;
  onDeleteForm: (form: ApiForm) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <BrandMark className="px-1 pt-1" showWordmark />
      <OrganizationSwitcher
        onOpenSettings={props.onOpenSettings}
        onSelect={props.onSelectOrganization}
        organizationId={props.organizationId}
        organizations={props.organizations}
      />
      <Button onClick={props.onNewForm} size="sm">
        <Plus />
        New form
      </Button>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FormList
          activeFormId={props.activeFormId}
          errorMessage={props.errorMessage}
          forms={props.forms}
          isAdmin={props.isAdmin}
          isLoading={props.isLoading}
          isStale={props.isStale}
          onDelete={props.onDeleteForm}
          onRename={props.onRenameForm}
          onRetry={props.onRetry}
          onSelect={props.onSelectForm}
        />
      </div>
      <Separator />
      <AccountMenu
        email={props.email}
        onOpenSettings={props.onOpenSettings}
        onSignOut={props.onSignOut}
      />
    </div>
  );
}
