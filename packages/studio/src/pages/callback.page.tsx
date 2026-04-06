import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/hooks";
import { exchangeCodeForToken } from "@/lib/auth";

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    document.title = "Signing in… — Studio";
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      return;
    }

    exchangeCodeForToken(code).then((result) => {
      if (!result) {
        return;
      }

      login(result.token, result.user);
      navigate("/", { replace: true });
    });
  }, [searchParams]);

  return null;
}
