import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const GITHUB_CLIENT_ID = "Ov23li4FIOQ5C4JM1EVe";
const API_BASE = "https://declarativeforms-api-2k4ts.ondigitalocean.app";

export function OAuthGitHubPage() {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    if (!code) {
      const loginState = searchParams.get("state") ?? "";
      const scope = "repo read:user";

      window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/oauth/github`
      )}&scope=${scope}&state=${encodeURIComponent(loginState)}`;

      return;
    }

    (async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/oauth/github/access_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();

      if (state && state.startsWith("/")) {
        window.location.href = `${state}?connection_id=${data.id}`;
      } else {
        window.location.href = `/test?access_token=${data.access_token}`;
      }
    })();
  }, [code, state, searchParams]);

  return null;
}
