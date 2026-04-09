import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/hooks";
import { exchangeCodeForToken, verifyMagicLink } from "@/lib/auth";

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = searchParams.get("token");
    const requestId = searchParams.get("request_id");

    if (token && requestId) {
      verifyMagicLink(requestId, token).then((result) => {
        if (!result) {
          navigate("/login?error=invalid_link", { replace: true });
          return;
        }

        login(result.token, result.user);
        navigate("/", { replace: true });
      });

      return;
    }

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
