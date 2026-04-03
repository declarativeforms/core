import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BuilderPaneProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

type BuilderSectionTitleProps = {
  children: ReactNode;
  className?: string;
};

type BuilderInsetProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted" | "dashed";
};

export function BuilderSectionTitle({
  children,
  className,
}: BuilderSectionTitleProps) {
  return (
    <p className={cn("text-xs font-medium uppercase tracking-wide text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function BuilderInset({
  children,
  className,
  variant = "muted",
}: BuilderInsetProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        variant === "default" && "border-border bg-background",
        variant === "muted" && "border-border bg-muted/10",
        variant === "dashed" && "border-dashed border-border bg-muted/10 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

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
        <BuilderSectionTitle>{title}</BuilderSectionTitle>
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
      <BuilderSectionTitle>{title}</BuilderSectionTitle>
    </div>
  );
}

export function BuilderPaneEmptyState({ children }: { children: ReactNode }) {
  return <BuilderInset variant="dashed" className="py-4">{children}</BuilderInset>;
}
