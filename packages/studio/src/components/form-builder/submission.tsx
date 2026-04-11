import { Check, ChevronDown, Copy } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(submission.data, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Item
      variant="outline"
      className="bg-white"
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
            aria-label="Copy submission"
            title="Copy submission"
            onClick={handleCopy}
          >
            {copied ? <Check className="text-emerald-600" /> : <Copy />}
          </Button>
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
          <pre className="overflow-x-auto rounded-xl bg-muted/20 p-4 text-sm text-foreground ring-1 ring-border/60">
            <code>{JSON.stringify(submission.data, null, 2)}</code>
          </pre>
        </div>
      ) : null}
    </Item>
  );
}
