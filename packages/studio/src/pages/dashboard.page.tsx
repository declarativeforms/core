import { FileText, Plus } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <Button type="button" onClick={onCreate} disabled={isPending}>
      <Plus />
      {isPending ? "Creating..." : "New Form"}
    </Button>
  );
}

function DashboardPageSection({ children }: { children: ReactNode }) {
  return (
    <PageShell className="overflow-y-auto">
      <div className="flex min-h-full flex-col gap-5">{children}</div>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
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
          className="max-w-xl items-start text-left"
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
            icon={<FileText className="size-6" />}
            title="No forms yet"
            description="Create your first form to start collecting responses and shaping your workflow."
            action={
              <DashboardPrimaryAction
                isPending={createForm.isPending}
                onCreate={handleCreateForm}
              />
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer transition-colors duration-150 hover:border-foreground/10 hover:bg-muted/20"
              onClick={() => navigate(`/forms/${form.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/forms/${form.id}`);
                }
              }}
            >
              <CardHeader className="gap-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold leading-6">
                    {getFormTitle(form.title)}
                  </CardTitle>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(form.updated_at ?? form.created_at ?? new Date())}
                  </span>
                </div>

                <CardDescription className="line-clamp-2 min-h-10 text-sm leading-6 text-muted-foreground">
                  {getFormDescription(form.description) || "No description yet."}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </DashboardPageSection>
  );
}
