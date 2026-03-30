import type { ReactNode } from "react";
import { LayoutDashboard, User } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-dvh w-full flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground/80"
        >
          <LayoutDashboard className="size-4 text-muted-foreground" />
          <span>Studio</span>
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="User menu"
        >
          <User className="text-muted-foreground" />
        </Button>
      </header>

      <div className="flex-1 min-h-0 bg-background">{children}</div>
    </div>
  );
}
