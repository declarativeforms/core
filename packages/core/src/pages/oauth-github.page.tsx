import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getBackendUrl } from '@/lib/api';

const GITHUB_CLIENT_ID = 'Ov23li4FIOQ5C4JM1EVe';

export function OAuthGitHubPage() {
  const [searchParams] = useSearchParams();

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    if (!code) {
      const loginState = searchParams.get('state') ?? '';
      const scope = 'repo read:user';

      window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        `${window.location.origin}/oauth/github`,
      )}&scope=${scope}&state=${encodeURIComponent(loginState)}`;

      return;
    }

    (async () => {
      const fallbackUrl = '/';
      const response = await fetch(getBackendUrl('oauth/github/access_token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        window.location.href = fallbackUrl;
        return;
      }

      const oauthResponse = await response.json();

      if (state && state.startsWith('/') && oauthResponse.access_token) {
        const redirectUrl = new URL(state, window.location.origin);
        redirectUrl.searchParams.set(
          'access_token',
          oauthResponse.access_token,
        );
        window.location.href = redirectUrl.toString();
      } else {
        window.location.href = fallbackUrl;
      }
    })();
  }, [code, state, searchParams]);

  return null;
}
