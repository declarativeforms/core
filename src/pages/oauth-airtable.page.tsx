import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

function generateRandomString() {
  const array = new Uint8Array(64);

  window.crypto.getRandomValues(array);

  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(codeVerifier: string) {
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function OAuthAirtablePage() {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");

  useEffect(() => {
    (async () => {
      if (!code) {
        const codeVerifier = generateRandomString();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateRandomString();

        window.sessionStorage.setItem("airtable_code_verifier", codeVerifier);

        const urlSearchParams = new URLSearchParams({
          client_id: "ec547df6-28f3-4cb9-894d-de6daf43ec88",
          redirect_uri: `${window.location.origin}/oauth/airtable`,
          response_type: "code",
          scope: "data.records:read data.records:write schema.bases:read",
          state: state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        });

        window.location.href = `https://airtable.com/oauth2/v1/authorize?${urlSearchParams.toString()}`;
      } else {
        const verifier = window.sessionStorage.getItem(
          "airtable_code_verifier"
        );

        window.sessionStorage.removeItem("airtable_code_verifier");

        if (!verifier) {
          return;
        }

        const response = await fetch(
          "https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/oauth/airtable/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
              redirect_uri: `${window.location.origin}/oauth/airtable`,
              code_verifier: verifier,
            }),
          }
        );

        const data = await response.json();

        window.location.href = `/connections?id=${data.id}`;
      }
    })();
  }, [code]);

  return null;
}
