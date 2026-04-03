import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col p-4 sm:p-5 md:p-6", className)}>
      {children}
    </div>
  );
}
