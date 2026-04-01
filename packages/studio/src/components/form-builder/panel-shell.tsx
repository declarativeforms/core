import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BuilderPaneProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function BuilderPane({
  title,
  children,
  footer,
  className,
  bodyClassName,
}: BuilderPaneProps) {
  return (
    <section className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <div className="shrink-0 px-3 py-2.5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3",
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-border p-3">{footer}</div>
      ) : null}
    </section>
  );
}

export function BuilderPaneHeader({ title }: { title: string }) {
  return (
    <div className="shrink-0 border-b border-border px-4 py-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
    </div>
  );
}

export function BuilderPaneEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
