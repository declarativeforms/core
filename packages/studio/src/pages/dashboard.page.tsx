import { FileText, Plus } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  EmptyState,
  PageHeader,
  PageShell,
} from "@/components";
import { useCreateForm, useForms } from "@/hooks";
import { createEmptyFormDefinition } from "@/lib/default-form";
import type { ILocalizedText } from "@/lib/declarative-form-types";
import { timeAgo } from "@/lib/utils";

function getTextValue(value: ILocalizedText | undefined) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value) {
    return "";
  }

  const firstTextValue = Object.values(value).find(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  );

  return typeof firstTextValue === "string" ? firstTextValue.trim() : "";
}

function getFormTitle(value: ILocalizedText | undefined) {
  return getTextValue(value) || "Untitled Form";
}

function getFormDescription(value: ILocalizedText | undefined) {
  return getTextValue(value);
}

function DashboardPrimaryAction({
  isPending,
  onCreate,
}: {
  isPending: boolean;
  onCreate: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCreate}
      disabled={isPending}
    >
      <Plus />
      {isPending ? "Creating..." : "New Form"}
    </Button>
  );
}

function DashboardPageSection({ children }: { children: ReactNode }) {
  return (
    <PageShell className="overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl min-h-full flex-col gap-5">
        {children}
      </div>
    </PageShell>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const createForm = useCreateForm();
  const { data: forms = [], isLoading, isError } = useForms();

  useEffect(() => {
    document.title = "Dashboard — Studio";
  }, []);

  const handleCreateForm = async () => {
    const form = await createForm.mutateAsync(createEmptyFormDefinition());

    if (form.id) {
      navigate(`/forms/${form.id}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardPageSection>
        <PageHeader
          title="Forms"
          actions={
            <DashboardPrimaryAction
              isPending={createForm.isPending}
              onCreate={handleCreateForm}
            />
          }
        />

        <div className="rounded-lg border border-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-border px-3 py-3 last:border-b-0"
            >
              <div className="size-4 animate-pulse rounded bg-muted" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="hidden h-3 w-1/4 animate-pulse rounded bg-muted sm:block" />
              </div>
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </DashboardPageSection>
    );
  }

  if (isError) {
    return (
      <DashboardPageSection>
        <PageHeader
          title="Forms"
          actions={
            <DashboardPrimaryAction
              isPending={createForm.isPending}
              onCreate={handleCreateForm}
            />
          }
        />

        <EmptyState
          title="Unable to load forms"
          description="Try again in a moment. Studio couldn’t fetch forms from the API."
          className="mx-auto"
        />
      </DashboardPageSection>
    );
  }

  return (
    <DashboardPageSection>
      <PageHeader
        title="Forms"
        actions={
          <DashboardPrimaryAction
            isPending={createForm.isPending}
            onCreate={handleCreateForm}
          />
        }
      />

      {forms.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<FileText className="size-5" />}
            title="No forms yet"
            description="Create your first form to start collecting responses."
            action={
              <DashboardPrimaryAction
                isPending={createForm.isPending}
                onCreate={handleCreateForm}
              />
            }
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          {forms.map((form) => (
            <div
              key={form.id}
              role="link"
              tabIndex={0}
              className="flex items-center gap-4 border-b border-border px-3 py-3 last:border-b-0 transition-colors duration-100 hover:bg-muted/40 cursor-pointer"
              onClick={() => navigate(`/forms/${form.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/forms/${form.id}`);
                }
              }}
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate text-sm font-semibold text-foreground hover:underline">
                  {getFormTitle(form.title)}
                </span>
                {getFormDescription(form.description) ? (
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                    {getFormDescription(form.description)}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo(form.updated_at ?? form.created_at ?? new Date())}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardPageSection>
  );
}
