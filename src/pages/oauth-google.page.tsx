import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function OAuthGooglePage() {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${"17125926114-76un21tfg8chl8gjnue9529pd8kq8v32.apps.googleusercontent.com"}&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/oauth/google`
      )}&scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/spreadsheets"
      )}&response_type=code&access_type=offline&prompt=consent`;

      return;
    } else {
      (async () => {
        const response = await fetch(
          "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/oauth/google/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
              redirect_uri: `${window.location.origin}/oauth/google`,
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
