import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  AppSidebar,
  BrandMark,
  Button,
  CreateBranchDialog,
  DeleteBranchDialog,
  DeleteFormDialog,
  EmptyState,
  ErrorState,
  FormHeader,
  OrganizationSettingsDialog,
  PublishDialog,
  RenameFormDialog,
  Sheet,
  SheetContent,
  SheetTitle,
  SkeletonRows,
} from '@/components';
import { apiPublicRequest, apiRequest } from '@/lib/api-client';
import {
  branchesPath,
  branchYamlPath,
  formsPath,
  messagesPath,
} from '@/lib/api-paths';
import type {
  ApiBranchYaml,
  ApiForm,
  ApiMessage,
  ApiOrganization,
  ApiRuntimeConfig,
} from '@/lib/api.types';
import { describeError } from '@/lib/error-messages';
import { buildFormUrl, DEFAULT_BRANCH } from '@/lib/preview-url';
import {
  readPersistedSelection,
  writePersistedSelection,
} from '@/lib/selection-store';
import { FormConversation } from '@/views/form-conversation.page';
import { NewForm } from '@/views/new-form.page';

type WorkspaceSnapshot = {
  branches: Array<string>;
  formBaseUrl: string | null;
  forms: Array<ApiForm>;
  messages: Array<ApiMessage>;
  yaml: ApiBranchYaml | null;
};

const EMPTY_BRANCHES: Array<string> = [];

async function loadWorkspace(
  organizationId: string,
  formId: string | null,
  branch: string,
): Promise<WorkspaceSnapshot> {
  const [forms, formBaseUrl] = await Promise.all([
    apiRequest<Array<ApiForm>>({
      method: 'GET',
      path: formsPath(organizationId),
    }),
    apiPublicRequest<ApiRuntimeConfig>({ method: 'GET', path: 'config' })
      .then((config) => config.form_base_url || null)
      .catch(() => null),
  ]);
  const snapshot: WorkspaceSnapshot = {
    branches: [],
    formBaseUrl,
    forms,
    messages: [],
    yaml: null,
  };

  if (!formId || !forms.some((form) => form.form_id === formId)) {
    return snapshot;
  }

  snapshot.branches = await apiRequest<Array<string>>({
    method: 'GET',
    path: branchesPath(organizationId, formId),
  });

  if (!snapshot.branches.includes(branch)) {
    return snapshot;
  }

  [snapshot.messages, snapshot.yaml] = await Promise.all([
    apiRequest<Array<ApiMessage>>({
      method: 'GET',
      path: messagesPath(organizationId, formId, branch),
    }),
    apiRequest<ApiBranchYaml>({
      method: 'GET',
      path: branchYamlPath(organizationId, formId, branch),
    }),
  ]);

  return snapshot;
}

export function Workspace(props: {
  organizations: Array<ApiOrganization>;
  email: string;
  onRefreshSession: () => void;
  onSignOut: () => void;
}) {
  const [preferredOrganizationId, setPreferredOrganizationId] = useState<
    string | null
  >(() => readPersistedSelection().organizationId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ApiForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiForm | null>(null);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isDeleteBranchOpen, setIsDeleteBranchOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const organization =
    props.organizations.find((entry) => entry.id === preferredOrganizationId) ??
    props.organizations[0] ??
    null;
  const organizationId = organization ? organization.id : null;
  const formId = params.formId ?? null;
  const branch = searchParams.get('branch') ?? DEFAULT_BRANCH;
  const workspaceQuery = useQuery({
    enabled: organization !== null,
    queryFn: () =>
      organization
        ? loadWorkspace(organization.id, formId, branch)
        : Promise.resolve(null),
    queryKey: ['workspace', organizationId, formId, branch],
    staleTime: 0,
  });
  const forms = workspaceQuery.data?.forms ?? [];
  const form = forms.find((entry) => entry.form_id === formId) ?? null;
  const branches = workspaceQuery.data?.branches ?? EMPTY_BRANCHES;
  const role =
    organization?.members.find((member) => member.email === props.email)
      ?.role ?? null;

  useEffect(() => {
    writePersistedSelection({ branch, formId, organizationId });
  }, [branch, formId, organizationId]);

  useEffect(() => {
    if (
      formId === null ||
      !workspaceQuery.isSuccess ||
      workspaceQuery.isFetching
    ) {
      return;
    }

    if (form) {
      return;
    }

    void navigate('/', { replace: true });
  }, [
    form,
    formId,
    navigate,
    workspaceQuery.isFetching,
    workspaceQuery.isSuccess,
  ]);

  useEffect(() => {
    if (!form || !workspaceQuery.isSuccess || workspaceQuery.isFetching) {
      return;
    }

    if (branches.includes(branch)) {
      return;
    }

    void navigate(`/forms/${encodeURIComponent(form.form_id)}`, {
      replace: true,
    });
  }, [
    branch,
    branches,
    form,
    navigate,
    workspaceQuery.isFetching,
    workspaceQuery.isSuccess,
  ]);

  const selectForm = (nextFormId: string, nextBranch: string): void => {
    const search =
      nextBranch === DEFAULT_BRANCH
        ? ''
        : `?branch=${encodeURIComponent(nextBranch)}`;
    void navigate(`/forms/${encodeURIComponent(nextFormId)}${search}`);
  };

  const clearForm = (): void => {
    void navigate('/');
  };

  const refreshWorkspace = (): void => {
    void workspaceQuery.refetch();
  };

  if (!organization || organizationId === null) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <BrandMark showWordmark size="lg" />
        <EmptyState
          description="Your account is not part of one yet. Reload, or ask an admin to add you."
          title="No organization yet"
        />
        <Button
          onClick={() => {
            window.location.reload();
          }}
          size="sm"
          variant="outline"
        >
          Reload
        </Button>
      </main>
    );
  }

  if (workspaceQuery.isError && !workspaceQuery.data) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <ErrorState
          message={describeError(workspaceQuery.error)}
          onRetry={refreshWorkspace}
        />
      </main>
    );
  }

  const sidebar = (
    <AppSidebar
      activeFormId={formId}
      email={props.email}
      forms={forms}
      isAdmin={role === 'admin'}
      isLoading={workspaceQuery.isPending}
      isStale={workspaceQuery.isError && !!workspaceQuery.data}
      onDeleteForm={setDeleteTarget}
      onNewForm={() => {
        clearForm();
        setIsSidebarOpen(false);
      }}
      onOpenSettings={() => {
        setIsSettingsOpen(true);
        setIsSidebarOpen(false);
      }}
      onRenameForm={setRenameTarget}
      onRetry={refreshWorkspace}
      onSelectForm={(nextFormId: string) => {
        selectForm(nextFormId, DEFAULT_BRANCH);
        setIsSidebarOpen(false);
      }}
      onSelectOrganization={(nextOrganizationId: string) => {
        setPreferredOrganizationId(nextOrganizationId);
        writePersistedSelection({
          branch: DEFAULT_BRANCH,
          formId: null,
          organizationId: nextOrganizationId,
        });
        clearForm();
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
        <SheetContent className="w-72 p-0 pt-12" side="left">
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
      <main className="flex min-h-0 flex-col">
        {form ? (
          <>
            <FormHeader
              branch={branch}
              branches={branches}
              form={form}
              formUrl={
                workspaceQuery.data?.formBaseUrl
                  ? buildFormUrl(
                      workspaceQuery.data.formBaseUrl,
                      form.form_id,
                      branch,
                    )
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
              onSelectBranch={(nextBranch: string) => {
                selectForm(form.form_id, nextBranch);
              }}
              onToggleSchema={() => {
                setIsSchemaOpen(!isSchemaOpen);
              }}
            />
            <FormConversation
              branch={branch}
              form={form}
              isSchemaOpen={isSchemaOpen}
              messages={workspaceQuery.data?.messages ?? []}
              onRefresh={refreshWorkspace}
              organizationId={organizationId}
              yaml={workspaceQuery.data?.yaml ?? null}
            />
          </>
        ) : formId && workspaceQuery.isPending ? (
          <div className="p-4">
            <SkeletonRows count={5} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
              <Button
                aria-label="Open menu"
                onClick={() => {
                  setIsSidebarOpen(true);
                }}
                size="icon-sm"
                variant="ghost"
              >
                <Menu className="size-4" />
              </Button>
              <BrandMark showWordmark />
            </div>
            <NewForm
              onCreated={selectForm}
              onRefresh={refreshWorkspace}
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
          onRefresh={props.onRefreshSession}
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
          onRefresh={refreshWorkspace}
          organizationId={organizationId}
        />
      ) : null}
      {deleteTarget ? (
        <DeleteFormDialog
          form={deleteTarget}
          isOpen
          onDeleted={clearForm}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) {
              setDeleteTarget(null);
            }
          }}
          onRefresh={refreshWorkspace}
          organizationId={organizationId}
        />
      ) : null}
      {form && isBranchOpen ? (
        <CreateBranchDialog
          branch={branch}
          branches={branches}
          form={form}
          isOpen
          onCreated={(nextBranch: string) => {
            selectForm(form.form_id, nextBranch);
          }}
          onOpenChange={setIsBranchOpen}
          onRefresh={refreshWorkspace}
          organizationId={organizationId}
        />
      ) : null}
      {form && isPublishOpen ? (
        <PublishDialog
          branch={branch}
          form={form}
          isOpen
          onOpenChange={setIsPublishOpen}
          onPublished={() => {
            selectForm(form.form_id, DEFAULT_BRANCH);
          }}
          onRefresh={refreshWorkspace}
          organizationId={organizationId}
        />
      ) : null}
      {form && isDeleteBranchOpen ? (
        <DeleteBranchDialog
          branch={branch}
          form={form}
          isOpen
          onDeleted={() => {
            selectForm(form.form_id, DEFAULT_BRANCH);
          }}
          onOpenChange={setIsDeleteBranchOpen}
          onRefresh={refreshWorkspace}
          organizationId={organizationId}
        />
      ) : null}
    </div>
  );
}
