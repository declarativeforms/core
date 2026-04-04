import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center rounded-lg border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
          {icon}
        </div>
      ) : null}

      <h2 className="text-sm font-semibold text-foreground">
        {title}
      </h2>

      {description ? (
        <p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
