import { Github } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, PageShell } from "@/components";
import { getGitHubOAuthUrl } from "@/lib/auth";

export function LoginPage() {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    document.title = "Sign in — Declarative Forms Studio";
  }, []);

  return (
    <PageShell className="items-center justify-center bg-muted/30">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {logoError ? (
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
            DF
          </div>
        ) : (
          <img
            src="/logo/icon.png"
            alt="Declarative Forms"
            className="size-12"
            onError={() => setLogoError(true)}
          />
        )}

        <div className="mt-4 space-y-0.5">
          <h1 className="text-xl font-semibold text-foreground">
            Declarative Forms
          </h1>
          <p className="text-sm font-medium text-muted-foreground">Studio</p>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with GitHub to get started.
        </p>

        <div className="mt-4 w-full">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              window.location.href = getGitHubOAuthUrl();
            }}
          >
            <Github className="size-4" />
            Continue with GitHub
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </PageShell>
  );
}
