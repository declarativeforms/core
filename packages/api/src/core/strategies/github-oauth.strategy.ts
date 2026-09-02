import type { GitHubOAuthGateway } from '../gateways';
import type { IOAuthTokens } from '../types';

export class GitHubOAuthStrategy {
  readonly type = 'github';
  readonly usesPkce = false;

  constructor(private gitHubOAuthGateway: GitHubOAuthGateway) {}

  public isConfigured(): boolean {
    return !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
  }

  public buildAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge: string | null,
  ): string {
    return this.gitHubOAuthGateway.buildAuthorizationUrl(
      redirectUri,
      state,
      codeChallenge,
    );
  }

  public async exchangeAuthorizationCode(
    redirectUri: string,
    code: string,
    codeVerifier: string | null,
  ): Promise<IOAuthTokens | null> {
    return this.gitHubOAuthGateway.exchangeAuthorizationCode(
      redirectUri,
      code,
      codeVerifier,
    );
  }

  public async retrieveEmail(accessToken: string): Promise<string | null> {
    return this.gitHubOAuthGateway.retrieveEmail(accessToken);
  }
}
