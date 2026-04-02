import type { ReactNode } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { useAuth } from "@/hooks";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-muted/40 text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4 shadow-[0_1px_0_0_theme(colors.border)]">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground/80"
        >
          <LayoutDashboard className="size-4 text-muted-foreground" />
          <span>Studio</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <span className="text-xs text-muted-foreground">{user.login}</span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            onClick={handleLogout}
          >
            <LogOut className="text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
