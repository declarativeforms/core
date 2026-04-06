import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, PageShell } from "@/components";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks";
import { getBackendUrl } from "@/lib/api";

export function DemoPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  // TODO: remove the error state.
  const [error, setError] = useState(false);
  // TODO: remove this ref, the useEffect should only be called once. Remove the dependencies of login and navigate in the useEffect
  const requestedRef = useRef(false);

  useEffect(() => {
    document.title = "Demo — Studio";
  }, []);

  useEffect(() => {
    if (requestedRef.current) {
      return;
    }

    requestedRef.current = true;

    fetch(getBackendUrl("auth/demo"), { method: "POST" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Demo authentication failed");
        }

        return response.json() as Promise<{
          token: string;
          user: { id: number; login: string; name: string | null; avatar_url: string };
        }>;
      })
      .then((data) => {
        login(data.token, data.user);
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError(true);
      });
  }, [login, navigate]);

  // TODO: remove the error state completely, it's okay to return null if an error happens.
  if (error) {
    return (
      <PageShell className="items-center justify-center">
        <EmptyState
          title="Demo unavailable"
          description="Something went wrong while setting up the demo. Please try again."
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
        <p className="text-sm font-medium text-foreground">Setting up demo…</p>
        <p className="text-sm text-muted-foreground">
          You'll be redirected momentarily.
        </p>
      </div>
    </PageShell>
  );
}
