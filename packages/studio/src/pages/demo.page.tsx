import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks";
import { getBackendUrl } from "@/lib/api";

export function DemoPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    document.title = "Demo — Studio";
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
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
        // Silently fail — this is a transient demo-auth handler.
      });
  }, []);

  return null;
}
