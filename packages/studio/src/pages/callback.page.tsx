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
  // TODO: remove this ref, the useEffect should only be called once. Remove the dependencies of login, navigate in the useEffect
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

  // TODO: remove the error state, you can return null if an error happens. We dont want to handle it now.
  if (error) {
    return (
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
    );
  }

   // TODO: return null here, no need to display anything to the user.
  return (
    <PageShell className="items-center justify-center">
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-foreground">Signing in…</p>
        <p className="text-sm text-muted-foreground">Completing your GitHub login.</p>
      </div>
    </PageShell>
  );
}
