import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

type DashboardForm = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "published";
  responseCount: number;
  updatedAt: string;
};

const dashboardFormsSeed: DashboardForm[] = [
  {
    id: "customer-feedback",
    title: "Customer Feedback Survey",
    description:
      "Capture structured product feedback from recent customers after onboarding and major feature releases.",
    status: "published",
    responseCount: 12,
    updatedAt: "2026-03-28T09:30:00.000Z",
  },
  {
    id: "event-registration",
    title: "Spring Event Registration",
    description:
      "Collect attendee details, accessibility requirements, and session preferences for the upcoming studio launch event.",
    status: "draft",
    responseCount: 0,
    updatedAt: "2026-03-30T07:45:00.000Z",
  },
  {
    id: "support-intake",
    title: "Support Request Intake",
    description:
      "Route support submissions with priority context, account references, and reproduction details for triage.",
    status: "published",
    responseCount: 38,
    updatedAt: "2026-03-24T13:15:00.000Z",
  },
  {
    id: "job-application",
    title: "Frontend Role Application",
    description:
      "Gather candidate experience, portfolio links, and screening responses for the studio hiring pipeline.",
    status: "draft",
    responseCount: 4,
    updatedAt: "2026-03-18T11:10:00.000Z",
  },
];

function StatusBadge({ status }: { status: DashboardForm["status"] }) {
  const badgeClassName =
    status === "published"
      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${badgeClassName}`}
    >
      {status}
    </span>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard — Studio";
  }, []);

  const {
    data: forms = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["studio", "forms"],
    queryFn: async () => dashboardFormsSeed,
  });

  const handleCreateForm = () => {
    navigate("/forms/new");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Forms</h1>
          <Button type="button" onClick={handleCreateForm}>
            <Plus />
            New Form
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="gap-4">
              <CardHeader className="space-y-2">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              </CardContent>
              <CardFooter className="justify-between">
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-full flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Forms</h1>
          <Button type="button" onClick={handleCreateForm}>
            <Plus />
            New Form
          </Button>
        </div>

        <Card className="gap-4 border-dashed">
          <CardHeader>
            <CardTitle>Unable to load forms</CardTitle>
            <CardDescription>
              Try again in a moment. The dashboard data source is still a placeholder.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Forms</h1>

        <Button type="button" onClick={handleCreateForm}>
          <Plus />
          New Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-8 py-12 text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
              <FileText className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-semibold text-foreground">
              No forms yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Create your first form to start collecting responses and shaping
              your workflow.
            </p>

            <Button type="button" className="mt-6" onClick={handleCreateForm}>
              <Plus />
              New Form
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              role="link"
              tabIndex={0}
              className="gap-4 cursor-pointer border-border transition-shadow hover:shadow-md"
              onClick={() => navigate(`/forms/${form.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/forms/${form.id}`);
                }
              }}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-medium">
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
              <CardFooter className="justify-between gap-3 border-t border-border pt-4">
                <StatusBadge status={form.status} />
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
  );
}
