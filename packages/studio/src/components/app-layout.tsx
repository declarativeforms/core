import { useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { useAuth } from "@/hooks";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-muted/30 text-foreground">
      <header className="flex h-16 shrink-0 items-center justify-between bg-[#0d1117] px-4 md:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 text-white transition-opacity hover:opacity-80"
        >
          {logoError ? (
            <div className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
              DF
            </div>
          ) : (
            <img
              src="/android-chrome-192x192.png"
              alt="Declarative Forms"
              className="size-8"
              onError={() => setLogoError(true)}
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Declarative Forms
            </span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs font-medium text-white/70">
              Studio
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <span className="text-xs font-medium text-white/70">
              {user.login}
            </span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
