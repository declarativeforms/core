import { Github } from "lucide-react";
import { useEffect } from "react";

import { Button, PageShell } from "@/components";
import { getGitHubOAuthUrl } from "@/lib/auth";

export function LoginPage() {
  useEffect(() => {
    document.title = "Sign in — Studio";
  }, []);

  return (
    <PageShell className="items-center justify-center bg-muted/30">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-lg border border-border bg-background">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6 text-muted-foreground"
          >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
          </svg>
        </div>

        <div className="mt-5 space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground">
            Welcome to Studio
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            Build forms from YAML. Share anywhere.
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            Sign in with GitHub to get started.
          </p>
        </div>

        <div className="mt-5 w-full">
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

        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </PageShell>
  );
}
