import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemDescription,
  PageHeader,
  PageShell,
} from "@/components";
import { useCreateForm, useForms } from "@/hooks";
import { createEmptyFormDefinition } from "@/lib/default-form";
import type { ILocalizedText } from "@declarativeforms/types";
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

export function DashboardPage() {
  const navigate = useNavigate();
  const createForm = useCreateForm();
  const formsQuery = useForms();

  if (!formsQuery.data) {
    return null;
  }

  return (
    <PageShell className="overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl min-h-full flex-col gap-5">
        <PageHeader
          title="Forms"
          description="Create and manage the forms you publish from Studio."
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const form = await createForm.mutateAsync(
                  createEmptyFormDefinition(),
                );

                if (form.id) {
                  navigate(`/forms/${form.id}`);
                }
              }}
              disabled={createForm.isPending}
            >
              <Plus />
              New Form
            </Button>
          }
        />

        {formsQuery.data.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No forms yet</EmptyTitle>
                <EmptyDescription>
                  Create your first form to start collecting responses.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-background/80 shadow-sm hover:bg-background"
                  onClick={async () => {
                    const form = await createForm.mutateAsync(
                      createEmptyFormDefinition(),
                    );

                    if (form.id) {
                      navigate(`/forms/${form.id}`);
                    }
                  }}
                  disabled={createForm.isPending}
                >
                  <Plus />
                  {createForm.isPending ? "Creating..." : "New Form"}
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <ItemGroup className="gap-y-3">
            {formsQuery.data.map((form) => (
              <Item
                className="bg-background/80 shadow-sm ring-1 ring-border/60"
                key={form.id}
                size="sm"
                onClick={() => navigate(`/forms/${form.id}`)}
              >
                <ItemMedia>
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {getTextValue(form.title) || "Untitled Form"}
                  </ItemTitle>
                  {getTextValue(form.description) ? (
                    <ItemDescription className="hidden sm:inline">
                      {getTextValue(form.description)}
                    </ItemDescription>
                  ) : null}
                </ItemContent>
                <ItemActions>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(form.updated_at ?? form.created_at ?? new Date())}
                  </span>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </div>
    </PageShell>
  );
}
