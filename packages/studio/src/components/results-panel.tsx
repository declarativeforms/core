import { Download, FileText } from "lucide-react";
import { Fragment, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components";
import { useSubmissions } from "@/hooks";
import type { ISubmission } from "@/lib/declarative-form-types";

type ResultsPanelProps = {
  formId: string;
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncateSubmissionId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function getPrimaryValues(values: Record<string, unknown>) {
  const entries = Object.entries(values).filter(([, value]) => {
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

  return entries.slice(0, 2);
}

function formatSubmissionValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return String(value ?? "");
  }

  return JSON.stringify(value);
}

function StatusBadge({ status }: { status: ISubmission["status"] }) {
  const className =
    status === "completed"
      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {status}
    </span>
  );
}

export function ResultsPanel({ formId }: ResultsPanelProps) {
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(
    null,
  );
  const { data: submissions = [], isLoading, isError } = useSubmissions(formId);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </div>

        <Card className="min-h-0 rounded-xl border-border shadow-sm">
          <CardHeader className="gap-1 pb-4">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/60" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<FileText className="size-6" />}
          title="Unable to load responses"
          description="Try again in a moment. Studio couldn’t fetch submissions from the API."
        />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<FileText className="size-6" />}
          title="No responses yet"
          description="Responses will appear here once people start submitting this form."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">Responses</h2>
          <p className="text-sm text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? "response" : "responses"}
          </p>
        </div>

        <Button type="button" variant="outline">
          <Download />
          Export
        </Button>
      </div>

      <Card className="min-h-0 min-w-0 rounded-xl border-border shadow-sm">
        <CardHeader className="gap-1 pb-4">
          <CardTitle className="text-base font-semibold">Submission log</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="max-h-[28rem] overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium text-foreground">Submission</th>
                    <th className="px-4 py-3 font-medium text-foreground">Submitted</th>
                    <th className="px-4 py-3 font-medium text-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-foreground">Key values</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => {
                    const isExpanded = expandedSubmissionId === submission.id;
                    const primaryValues = getPrimaryValues(submission.data);
                    const handleToggle = () => {
                      setExpandedSubmissionId((current) =>
                        current === submission.id ? null : submission.id,
                      );
                    };

                    return (
                      <Fragment key={submission.id}>
                        <tr
                          className="cursor-pointer border-b border-border/70 transition-colors duration-150 hover:bg-muted/40"
                          onClick={handleToggle}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {truncateSubmissionId(submission.id)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatSubmittedAt(submission.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={submission.status} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {primaryValues.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {primaryValues.map(([key, value]) => (
                                  <span key={key}>
                                    <span className="font-medium text-foreground">
                                      {key.replace(/_/g, " ")}:
                                    </span>{" "}
                                    {formatSubmissionValue(value)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-b border-border/70 bg-muted/10">
                            <td colSpan={4} className="px-4 py-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                {Object.entries(submission.data).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="rounded-lg border border-border bg-background px-3 py-3"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      {key.replace(/_/g, " ")}
                                    </p>
                                    <p className="mt-2 text-sm text-foreground">
                                      {formatSubmissionValue(value) || "—"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
