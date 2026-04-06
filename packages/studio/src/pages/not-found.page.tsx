import { Compass } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

import { Button, EmptyState, PageShell } from "@/components";

// TODO: instead of having a not found page, where the not found page is being used, just redirect the user to the dashboard page.
export function NotFoundPage() {
  useEffect(() => {
    document.title = "404 — Studio";
  }, []);

  return (
    <PageShell className="items-center justify-center">
      <EmptyState
        icon={<Compass className="size-6" />}
        title="Page not found"
        description="The page you’re looking for doesn’t exist in Studio."
        action={
          <Button asChild type="button" variant="outline">
            <Link to="/">Back to dashboard</Link>
          </Button>
        }
      />
    </PageShell>
  );
}
