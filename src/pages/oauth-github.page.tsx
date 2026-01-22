import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function OAuthGitHubPage() {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${"Ov23li4FIOQ5C4JM1EVe"}&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/oauth/github`
      )}&scope=${"read:user"}`;

      return;
    } else {
      (async () => {
        const response = await fetch(
          "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/oauth/github/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
            }),
          }
        );

        const data = await response.json();

        window.location.href = `/test?access_token=${data.access_token}`;
      })();
    }
  }, [code]);

  return null;
}
