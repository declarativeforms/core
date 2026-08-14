import { createHash } from 'node:crypto';
import type { GitHubOAuthGateway } from '../gateways';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  const resource = 'https://mcp.frms.dev/mcp';
  const redirectUri = 'http://127.0.0.1:3000/callback';
  const verifier = 'a'.repeat(43);
  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url');
  const gitHubOAuthGateway = {
    exchangeAuthorizationCode: jest.fn(),
    getAuthorizationUrl: jest.fn(
      (state: string, _codeChallenge: string) =>
        `https://github.com/login/oauth/authorize?state=${encodeURIComponent(state)}`,
    ),
    refreshAccessToken: jest.fn(),
  } as unknown as GitHubOAuthGateway;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers clients and completes the GitHub authorization flow', async () => {
    jest
      .mocked(gitHubOAuthGateway.exchangeAuthorizationCode)
      .mockResolvedValue({
        accessToken: 'github-access-token',
        expiresIn: 28800,
        refreshToken: 'github-refresh-token',
        refreshTokenExpiresIn: 15897600,
      });
    const service = createService();
    const client = service.registerClient({
      client_name: 'Test MCP Client',
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
    });

    expect(client).not.toBeNull();

    const authorizationUrl = service.beginAuthorization({
      clientId: client?.client_id,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      redirectUri,
      resource,
      responseType: 'code',
      scope: 'mcp',
      state: 'client-state',
    });
    const githubState = new URL(authorizationUrl as string).searchParams.get(
      'state',
    );
    const callbackUrl = service.completeAuthorization(
      githubState as string,
      'github-code',
    );
    const callback = new URL(callbackUrl as string);
    const tokens = await service.exchangeToken({
      clientId: client?.client_id,
      code: callback.searchParams.get('code') as string,
      codeVerifier: verifier,
      grantType: 'authorization_code',
      redirectUri,
      resource,
    });

    expect(callback.origin + callback.pathname).toBe(redirectUri);
    expect(callback.searchParams.get('state')).toBe('client-state');
    expect(callback.searchParams.get('iss')).toBe('https://mcp.frms.dev');
    expect(tokens?.access_token).not.toBe('github-access-token');
    expect(tokens?.access_token).not.toContain('github-access-token');
    expect(tokens?.refresh_token).not.toBe('github-refresh-token');
    expect(gitHubOAuthGateway.exchangeAuthorizationCode).toHaveBeenCalledWith(
      'github-code',
      expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
    );

    await expect(
      service.verifyAccessToken(tokens?.access_token as string),
    ).resolves.toMatchObject({
      clientId: client?.client_id,
      extra: { githubToken: 'github-access-token' },
      resource: new URL(resource),
      scopes: ['mcp'],
    });
  });

  it('refreshes access with a rotated GitHub refresh token', async () => {
    const service = createService();
    const client = service.registerClient({ redirect_uris: [redirectUri] });
    jest
      .mocked(gitHubOAuthGateway.exchangeAuthorizationCode)
      .mockResolvedValue({
        accessToken: 'first-access-token',
        refreshToken: 'first-refresh-token',
      });
    jest.mocked(gitHubOAuthGateway.refreshAccessToken).mockResolvedValue({
      accessToken: 'second-access-token',
      refreshToken: 'second-refresh-token',
    });
    const initialTokens = await authorize(service, client?.client_id as string);
    const refreshedTokens = await service.exchangeToken({
      clientId: client?.client_id,
      grantType: 'refresh_token',
      refreshToken: initialTokens?.refresh_token,
      resource,
    });

    expect(gitHubOAuthGateway.refreshAccessToken).toHaveBeenCalledWith(
      'first-refresh-token',
    );
    await expect(
      service.verifyAccessToken(refreshedTokens?.access_token as string),
    ).resolves.toMatchObject({
      extra: { githubToken: 'second-access-token' },
    });
  });

  it('rejects unsafe redirect URIs and tokens it did not issue', async () => {
    const service = createService();

    expect(
      service.registerClient({
        redirect_uris: ['http://example.com/callback'],
      }),
    ).toBeNull();
    await expect(
      service.verifyAccessToken('github-personal-access-token'),
    ).rejects.toThrow('Invalid access token');
  });

  function createService(): AuthenticationService {
    return new AuthenticationService(
      gitHubOAuthGateway,
      'a-secret-that-is-never-sent-to-the-client',
      'https://mcp.frms.dev',
    );
  }

  async function authorize(
    service: AuthenticationService,
    clientId: string,
  ) {
    const authorizationUrl = service.beginAuthorization({
      clientId,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      redirectUri,
      resource,
      responseType: 'code',
      state: 'client-state',
    });
    const githubState = new URL(authorizationUrl as string).searchParams.get(
      'state',
    );
    const callbackUrl = service.completeAuthorization(
      githubState as string,
      'github-code',
    );
    const code = new URL(callbackUrl as string).searchParams.get('code');

    return service.exchangeToken({
      clientId,
      code: code as string,
      codeVerifier: verifier,
      grantType: 'authorization_code',
      redirectUri,
      resource,
    });
  }
});
