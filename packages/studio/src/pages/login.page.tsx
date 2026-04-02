import { Github } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui";
import { getGitHubOAuthUrl } from "@/lib/auth";

export function LoginPage() {
  useEffect(() => {
    document.title = "Sign in — Studio";
  }, []);

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-muted/40 px-4">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
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

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome to Studio
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Build forms from YAML. Share anywhere.
        </p>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Sign in with GitHub to get started.
        </p>

        <div className="mt-6 w-full">
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

        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
