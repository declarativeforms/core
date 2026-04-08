import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge, Button } from "@/components/ui";
import { useAuth } from "@/hooks";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <div className="flex h-dvh w-full flex-col bg-muted/30 text-foreground">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 text-foreground transition-opacity hover:opacity-80"
        >
          <img
            src="/android-chrome-192x192.png"
            alt="Declarative Forms"
            className="size-8"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Declarative Forms
            </span>
            <Badge>Studio</Badge>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <span className="text-xs font-medium text-muted-foreground">
              {user.login}
            </span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
