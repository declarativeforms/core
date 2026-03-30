import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  PageShell,
} from "@/components";
import { listForms, type StudioFormListItem } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

export function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard — Studio";
  }, []);

  const {
    data: forms = [],
    isLoading,
    isError,
  } = useQuery<StudioFormListItem[]>({
    queryKey: ["studio", "forms"],
    queryFn: async () => listForms(),
  });

  const handleCreateForm = () => {
    navigate("/forms/new");
  };

  if (isLoading) {
    return (
      <PageShell className="overflow-y-auto">
        <div className="flex min-h-full flex-col gap-6">
          <PageHeader
            title="Forms"
            actions={
              <Button type="button" onClick={handleCreateForm}>
                <Plus />
                New Form
              </Button>
            }
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="rounded-xl border-border shadow-sm">
                <CardHeader className="space-y-2 pb-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                </CardContent>
                <CardFooter className="justify-between border-t border-border pt-4">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell className="overflow-y-auto">
        <div className="flex min-h-full flex-col gap-6">
          <PageHeader
            title="Forms"
            actions={
              <Button type="button" onClick={handleCreateForm}>
                <Plus />
                New Form
              </Button>
            }
          />

          <EmptyState
            title="Unable to load forms"
            description="Try again in a moment. The dashboard data source is still a placeholder."
            className="max-w-none items-start text-left"
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="overflow-y-auto">
      <div className="flex min-h-full flex-col gap-6">
        <PageHeader
          title="Forms"
          actions={
            <Button type="button" onClick={handleCreateForm}>
              <Plus />
              New Form
            </Button>
          }
        />

        {forms.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<FileText className="size-6" />}
              title="No forms yet"
              description="Create your first form to start collecting responses and shaping your workflow."
              action={
                <Button type="button" onClick={handleCreateForm}>
                  <Plus />
                  New Form
                </Button>
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
                className="cursor-pointer rounded-xl border-border shadow-sm transition-[border-color,box-shadow] hover:shadow-md"
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
                      {form.title}
                    </CardTitle>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(form.updatedAt)}
                    </span>
                  </div>

                  <CardDescription className="line-clamp-2 min-h-10 text-sm leading-6 text-muted-foreground">
                    {form.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-end gap-3 border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    {form.responseCount}{" "}
                    {form.responseCount === 1 ? "response" : "responses"}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
