import type { IGitHubOAuthTokens } from '../types';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export class GitHubOAuthGateway {
  constructor(
    private clientId: string,
    private clientSecret: string,
    private callbackUrl: string,
  ) {}

  public getAuthorizationUrl(state: string, codeChallenge: string): string {
    const url = new URL(GITHUB_AUTHORIZE_URL);

    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('state', state);

    return url.toString();
  }

  public async exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
  ): Promise<IGitHubOAuthTokens | null> {
    return this.retrieveTokens({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      code_verifier: codeVerifier,
      redirect_uri: this.callbackUrl,
    });
  }

  public async refreshAccessToken(
    refreshToken: string,
  ): Promise<IGitHubOAuthTokens | null> {
    return this.retrieveTokens({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
  }

  private async retrieveTokens(
    values: Record<string, string>,
  ): Promise<IGitHubOAuthTokens | null> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(values).toString(),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const value = (await response.json()) as {
      access_token?: string;
      error?: string;
      expires_in?: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
    };

    if (value.error || !value.access_token) {
      return null;
    }

    return {
      accessToken: value.access_token,
      expiresIn: value.expires_in,
      refreshToken: value.refresh_token,
      refreshTokenExpiresIn: value.refresh_token_expires_in,
    };
  }
}
