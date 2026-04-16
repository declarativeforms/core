import { getBackendUrl } from "./api";

const TOKEN_KEY = "studio_auth_token";
const USER_KEY = "studio_auth_user";
const SIGN_IN_SALT = "sign_in";

export type AuthUser = {
  username: string;
};

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;

    if (typeof parsed.username !== "string" || parsed.username.length === 0) {
      return null;
    }

    return {
      username: parsed.username,
    };
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();

  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

export function getGitHubOAuthUrl(): string {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID ?? "";
  const redirectUri = `${window.location.origin}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<{ token: string; user: AuthUser } | null> {
  const response = await fetch(getBackendUrl("auth/github"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { token: string; user: AuthUser };

  return data;
}

export async function sendMagicLink(
  email: string,
  redirectUrl: string,
): Promise<{ request_id: string } | null> {
  const response = await fetch(getBackendUrl("auth/magic-link/send"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      redirect_url: redirectUrl,
      salt: SIGN_IN_SALT,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { request_id: string };
}

export async function verifyMagicLink(
  requestId: string,
  token: string,
): Promise<{ token: string; user: AuthUser } | null> {
  const response = await fetch(getBackendUrl("auth/magic-link/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: requestId,
      salt: SIGN_IN_SALT,
      token,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { token: string; user: AuthUser };
}
