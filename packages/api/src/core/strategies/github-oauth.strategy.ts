import type { GitHubOAuthGateway } from '../gateways';
import type { IOAuthTokens, IOAuthUser } from '../types';

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

  public async getAccessToken(
    redirectUri: string,
    code: string,
    codeVerifier: string | null,
  ): Promise<IOAuthTokens | null> {
    return this.gitHubOAuthGateway.getAccessToken(
      redirectUri,
      code,
      codeVerifier,
    );
  }

  public async findUser(accessToken: string): Promise<IOAuthUser | null> {
    return this.gitHubOAuthGateway.findUser(accessToken);
  }
}
