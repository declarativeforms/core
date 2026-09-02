import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ApiFormSummary, ApiOrganization } from '@/lib/api.types';
import {
  AppSidebar,
  CreateBranchDialog,
  DeleteBranchDialog,
  DeleteFormDialog,
  FormHeader,
  OrganizationSettingsDialog,
  PublishDialog,
  RenameFormDialog,
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components';
import { useForms } from '@/hooks/use-forms';
import { useRole } from '@/hooks/use-role';
import { useRuntimeConfig } from '@/hooks/use-runtime-config';
import { useSelection } from '@/hooks/use-selection';
import { describeError } from '@/lib/error-messages';
import { buildFormUrl, DEFAULT_BRANCH } from '@/lib/preview-url';
import { readPersistedSelection } from '@/lib/selection-store';
import { FormConversation } from '@/views/form-conversation.page';
import { NewForm } from '@/views/new-form.page';

export function Workspace(props: {
  organizations: Array<ApiOrganization>;
  email: string;
  onSignOut: () => void;
}) {
  const [preferredOrganizationId, setPreferredOrganizationId] = useState<
    string | null
  >(() => readPersistedSelection().organizationId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ApiFormSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiFormSummary | null>(null);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isDeleteBranchOpen, setIsDeleteBranchOpen] = useState(false);

  const navigate = useNavigate();
  const organization =
    props.organizations.find((entry) => entry.id === preferredOrganizationId) ??
    props.organizations[0] ??
    null;
  const organizationId = organization ? organization.id : null;
  const selection = useSelection(organizationId);
  const formsQuery = useForms(organizationId);
  const formBaseUrl = useRuntimeConfig();
  const role = useRole(organization, props.email);
  const forms = formsQuery.data ?? [];
  const form =
    forms.find((entry) => entry.form_id === selection.formId) ?? null;
  const formId = selection.formId;
  const branch = selection.branch;

  useEffect(() => {
    const loaded = formsQuery.data;

    if (!loaded || formId === null) {
      return;
    }

    if (loaded.some((entry) => entry.form_id === formId)) {
      return;
    }

    void navigate('/', { replace: true });
  }, [formId, formsQuery.data, navigate]);

  useEffect(() => {
    if (!form || form.branches.includes(branch)) {
      return;
    }

    void navigate(`/forms/${encodeURIComponent(form.form_id)}`, {
      replace: true,
    });
  }, [branch, form, navigate]);

  if (!organization || organizationId === null) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No organization yet. Reload to try again.
        </p>
      </main>
    );
  }

  const sidebar = (
    <AppSidebar
      activeFormId={selection.formId}
      email={props.email}
      errorMessage={
        formsQuery.isError && forms.length === 0
          ? describeError(formsQuery.error)
          : null
      }
      forms={forms}
      isAdmin={role === 'admin'}
      isLoading={formsQuery.isPending}
      isStale={formsQuery.isError && forms.length > 0}
      onDeleteForm={setDeleteTarget}
      onNewForm={() => {
        selection.clearForm();
        setIsSidebarOpen(false);
      }}
      onOpenSettings={() => {
        setIsSettingsOpen(true);
        setIsSidebarOpen(false);
      }}
      onRenameForm={setRenameTarget}
      onRetry={() => {
        void formsQuery.refetch();
      }}
      onSelectForm={(formId: string) => {
        selection.selectForm(formId, DEFAULT_BRANCH);
        setIsSidebarOpen(false);
      }}
      onSelectOrganization={(next: string) => {
        setPreferredOrganizationId(next);
        selection.selectOrganization(next);
        setIsSidebarOpen(false);
      }}
      onSignOut={props.onSignOut}
      organizationId={organizationId}
      organizations={props.organizations}
    />
  );

  return (
    <div className="grid h-svh grid-cols-1 md:grid-cols-[16rem_1fr]">
      <aside className="hidden min-h-0 border-r border-border md:block">
        {sidebar}
      </aside>
      <Sheet onOpenChange={setIsSidebarOpen} open={isSidebarOpen}>
        <SheetContent className="w-72 p-0" side="left">
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
      <main className="flex min-h-0 flex-col">
        {form ? (
          <>
            <FormHeader
              branch={selection.branch}
              form={form}
              formUrl={
                formBaseUrl
                  ? buildFormUrl(formBaseUrl, form.form_id, selection.branch)
                  : null
              }
              isAdmin={role === 'admin'}
              isSchemaOpen={isSchemaOpen}
              onDeleteBranch={() => {
                setIsDeleteBranchOpen(true);
              }}
              onDeleteForm={() => {
                setDeleteTarget(form);
              }}
              onNewBranch={() => {
                setIsBranchOpen(true);
              }}
              onOpenSidebar={() => {
                setIsSidebarOpen(true);
              }}
              onPublish={() => {
                setIsPublishOpen(true);
              }}
              onRename={() => {
                setRenameTarget(form);
              }}
              onSelectBranch={selection.selectBranch}
              onToggleSchema={() => {
                setIsSchemaOpen(!isSchemaOpen);
              }}
            />
            <FormConversation
              branch={selection.branch}
              form={form}
              isSchemaOpen={isSchemaOpen}
              organizationId={organizationId}
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
              <button
                className="rounded px-2 py-1 text-sm hover:bg-muted"
                onClick={() => {
                  setIsSidebarOpen(true);
                }}
                type="button"
              >
                Menu
              </button>
            </div>
            <NewForm
              onCreated={selection.selectForm}
              organizationId={organizationId}
            />
          </>
        )}
      </main>
      {isSettingsOpen ? (
        <OrganizationSettingsDialog
          currentEmail={props.email}
          isAdmin={role === 'admin'}
          isOpen
          onOpenChange={setIsSettingsOpen}
          organization={organization}
        />
      ) : null}
      {renameTarget ? (
        <RenameFormDialog
          form={renameTarget}
          isOpen
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) {
              setRenameTarget(null);
            }
          }}
          organizationId={organizationId}
        />
      ) : null}
      {deleteTarget ? (
        <DeleteFormDialog
          form={deleteTarget}
          isOpen
          onDeleted={selection.clearForm}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) {
              setDeleteTarget(null);
            }
          }}
          organizationId={organizationId}
        />
      ) : null}
      {form && isBranchOpen ? (
        <CreateBranchDialog
          branch={selection.branch}
          form={form}
          isOpen
          onCreated={(branch: string) => {
            selection.selectForm(form.form_id, branch);
          }}
          onOpenChange={setIsBranchOpen}
          organizationId={organizationId}
        />
      ) : null}
      {form && isPublishOpen ? (
        <PublishDialog
          branch={selection.branch}
          form={form}
          isOpen
          onOpenChange={setIsPublishOpen}
          onPublished={() => {
            selection.selectForm(form.form_id, DEFAULT_BRANCH);
          }}
          organizationId={organizationId}
        />
      ) : null}
      {form && isDeleteBranchOpen ? (
        <DeleteBranchDialog
          branch={selection.branch}
          form={form}
          isOpen
          onDeleted={() => {
            selection.selectForm(form.form_id, DEFAULT_BRANCH);
          }}
          onOpenChange={setIsDeleteBranchOpen}
          organizationId={organizationId}
        />
      ) : null}
    </div>
  );
}
