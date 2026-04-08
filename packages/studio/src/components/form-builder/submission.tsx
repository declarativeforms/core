import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components";
import type { ISubmission } from "@declarativeforms/types";

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

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function Submission({ submission }: { submission: ISubmission }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Item
      variant="outline"
      className={isExpanded ? "border-foreground/15 bg-muted/5" : ""}
    >
      <ItemHeader>
        <ItemContent>
          <ItemTitle>{truncateSubmissionId(submission.id)}</ItemTitle>
          <ItemDescription>
            {formatSubmittedAt(submission.created_at)}
          </ItemDescription>
        </ItemContent>

        <ItemActions>
          <Badge
            variant={
              submission.status === "completed" ? "completed" : "partial"
            }
          >
            {submission.status}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded((current) => !current)}
          >
            <ChevronDown
              className={
                isExpanded
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </ItemActions>
      </ItemHeader>

      {isExpanded ? (
        <div className="basis-full border-t border-border pt-4">
          <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-sm text-foreground">
            <code>{JSON.stringify(submission.data, null, 2)}</code>
          </pre>
        </div>
      ) : null}
    </Item>
  );
}
