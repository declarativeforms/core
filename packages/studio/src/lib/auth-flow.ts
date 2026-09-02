import { apiPublicRequest } from '@/lib/api-client';
import { authorizePath } from '@/lib/api-paths';
import type { ApiAccessToken } from '@/lib/api.types';

const AUTH_CODE_KEY = 'auth_code';

let pendingExchange: Promise<ApiAccessToken> | null = null;

export function buildRedirectUri(): string {
  return `${window.location.origin}/`;
}

export function readAuthCode(): string | null {
  return new URLSearchParams(window.location.search).get(AUTH_CODE_KEY);
}

export function stripAuthCode(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(AUTH_CODE_KEY);
  window.history.replaceState(
    null,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function startGithubAuthorization(): void {
  window.location.assign(`/api/v1/${authorizePath(buildRedirectUri())}`);
}

export function exchangeAuthCode(authCode: string): Promise<ApiAccessToken> {
  if (pendingExchange) {
    return pendingExchange;
  }

  pendingExchange = apiPublicRequest<ApiAccessToken>({
    body: { auth_code: authCode },
    method: 'POST',
    path: 'auth/token',
  });

  return pendingExchange;
}
