import type { IOAuthTokens } from '../types';

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const API_URL = 'https://api.github.com';

export class GitHubOAuthGateway {
  public buildAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge: string | null,
  ): string {
    const url = new URL(AUTHORIZE_URL);

    url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID || '');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set(
      'scope',
      process.env.GITHUB_OAUTH_SCOPE || 'read:user user:email',
    );
    url.searchParams.set('state', state);

    if (codeChallenge) {
      url.searchParams.set('code_challenge', codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }

    return url.toString();
  }

  public async exchangeAuthorizationCode(
    redirectUri: string,
    code: string,
    codeVerifier: string | null,
  ): Promise<IOAuthTokens | null> {
    const response = await fetch(TOKEN_URL, {
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
      }),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as {
      access_token?: string;
      error?: string;
      expires_in?: number;
    };

    if (value.error || !value.access_token) {
      return null;
    }

    return {
      accessToken: value.access_token,
      expiresIn: value.expires_in ?? null,
    };
  }

  public async retrieveEmail(accessToken: string): Promise<string | null> {
    const response = await fetch(`${API_URL}/user/emails`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'declarativeforms',
      },
    });

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as Array<{
      email?: string;
      primary?: boolean;
      verified?: boolean;
    }>;

    const primary = value.find(
      (entry) => entry.primary && entry.verified && entry.email,
    );

    return primary?.email ?? null;
  }
}
