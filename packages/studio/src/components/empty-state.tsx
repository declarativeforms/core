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
        "flex w-full max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-muted/10 px-8 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-14 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm">
          {icon}
        </div>
      ) : null}

      <h2 className="text-base font-semibold text-foreground">
        {title}
      </h2>

      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
