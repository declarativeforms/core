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
        "flex w-full max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-8 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm">
          {icon}
        </div>
      ) : null}

      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>

      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
