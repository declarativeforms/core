import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState, PageShell } from "@/components";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks";
import { exchangeCodeForToken } from "@/lib/auth";

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState(false);
  const exchangedRef = useRef(false);

  useEffect(() => {
    document.title = "Signing in… — Studio";
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code || exchangedRef.current) {
      if (!code) {
        setError(true);
      }

      return;
    }

    exchangedRef.current = true;

    exchangeCodeForToken(code).then((result) => {
      if (!result) {
        setError(true);
        return;
      }

      login(result.token, result.user);
      navigate("/", { replace: true });
    });
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <PageShell className="items-center justify-center">
          <EmptyState
            title="Authentication failed"
            description="Something went wrong while signing in. Please try again."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/login", { replace: true })}
              >
                Back to sign in
              </Button>
            }
          />
        </PageShell>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Signing in…</p>
    </div>
  );
}
