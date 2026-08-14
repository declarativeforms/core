import { GitHubOAuthGateway } from './github-oauth';

describe('GitHubOAuthGateway', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('creates the GitHub App authorization URL', () => {
    const gateway = new GitHubOAuthGateway(
      'github-client-id',
      'github-client-secret',
      'https://mcp.frms.dev/oauth/callback',
    );
    const url = new URL(
      gateway.getAuthorizationUrl('signed-state', 'github-code-challenge'),
    );

    expect(url.origin + url.pathname).toBe(
      'https://github.com/login/oauth/authorize',
    );
    expect(url.searchParams.get('client_id')).toBe('github-client-id');
    expect(url.searchParams.get('code_challenge')).toBe(
      'github-code-challenge',
    );
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://mcp.frms.dev/oauth/callback',
    );
    expect(url.searchParams.get('state')).toBe('signed-state');
    expect(url.toString()).not.toContain('github-client-secret');
  });

  it('exchanges an authorization code for GitHub tokens', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        access_token: 'github-access-token',
        expires_in: 28800,
        refresh_token: 'github-refresh-token',
        refresh_token_expires_in: 15897600,
      }),
      ok: true,
    });
    global.fetch = fetchMock;
    const gateway = new GitHubOAuthGateway(
      'github-client-id',
      'github-client-secret',
      'https://mcp.frms.dev/oauth/callback',
    );

    await expect(
      gateway.exchangeAuthorizationCode('github-code', 'github-code-verifier'),
    ).resolves.toEqual({
      accessToken: 'github-access-token',
      expiresIn: 28800,
      refreshToken: 'github-refresh-token',
      refreshTokenExpiresIn: 15897600,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://github.com/login/oauth/access_token',
      {
        body: new URLSearchParams({
          client_id: 'github-client-id',
          client_secret: 'github-client-secret',
          code: 'github-code',
          code_verifier: 'github-code-verifier',
          redirect_uri: 'https://mcp.frms.dev/oauth/callback',
        }).toString(),
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      },
    );
  });

  it('returns null when GitHub rejects the exchange', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ error: 'bad_verification_code' }),
      ok: true,
    });
    const gateway = new GitHubOAuthGateway(
      'github-client-id',
      'github-client-secret',
      'https://mcp.frms.dev/oauth/callback',
    );

    await expect(
      gateway.exchangeAuthorizationCode('invalid-code', 'code-verifier'),
    ).resolves.toBeNull();
  });
});
