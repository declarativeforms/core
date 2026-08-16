import { createHash } from 'node:crypto';
import { McpAuthentication } from './authentication';

describe('McpAuthentication', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('advertises one authorization-code flow and registers a client', () => {
    const authentication = createAuthentication();
    const metadata = authentication.getAuthorizationServerMetadata();
    const client = authentication.registerClient({
      application_type: 'native',
      client_name: 'Codex',
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: ['http://127.0.0.1:4567/callback'],
    });

    expect(metadata).toMatchObject({
      grant_types_supported: ['authorization_code'],
      scopes_supported: ['forms:write'],
    });
    expect(client).toMatchObject({
      application_type: 'native',
      grant_types: ['authorization_code'],
      redirect_uris: ['http://127.0.0.1:4567/callback'],
      scope: 'forms:write',
      token_endpoint_auth_method: 'none',
    });
    expect(client).not.toHaveProperty('refresh_token');
  });

  it('completes PKCE login and issues a resource-bound GitHub access token', async () => {
    fetchMock.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        access_token: 'github-access-token',
      }),
      ok: true,
    });
    const authentication = createAuthentication();
    const client = authentication.registerClient({
      redirect_uris: ['http://127.0.0.1:4567/callback'],
    });
    const verifier = 'v'.repeat(43);
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const githubUrl = authentication.beginAuthorization({
      clientId: client?.client_id,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      redirectUri: 'http://127.0.0.1:4567/callback',
      resource: 'https://frms.dev/mcp',
      responseType: 'code',
      scope: 'forms:write',
      state: 'client-state',
    });
    const state = githubUrl
      ? new URL(githubUrl).searchParams.get('state')
      : null;
    const clientUrl = authentication.completeAuthorization(
      state || '',
      'github-code',
    );
    const code = clientUrl ? new URL(clientUrl).searchParams.get('code') : null;
    const tokens = await authentication.exchangeToken({
      clientId: client?.client_id,
      code: code || '',
      codeVerifier: verifier,
      grantType: 'authorization_code',
      redirectUri: 'http://127.0.0.1:4567/callback',
      resource: 'https://frms.dev/mcp',
    });

    expect(githubUrl).toContain('https://github.com/login/oauth/authorize');
    expect(clientUrl).toContain('state=client-state');
    expect(tokens).toMatchObject({
      expires_in: 30 * 24 * 60 * 60,
      scope: 'forms:write',
      token_type: 'Bearer',
    });
    expect(tokens).not.toHaveProperty('refresh_token');
    expect(
      authentication.verifyAccessToken(tokens?.access_token || ''),
    ).toMatchObject({
      clientId: client?.client_id,
      githubToken: 'github-access-token',
      resource: 'https://frms.dev/mcp',
      scope: 'forms:write',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://github.com/login/oauth/access_token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects invalid clients, altered tokens, and refresh grants', async () => {
    const authentication = createAuthentication();

    expect(
      authentication.registerClient({
        redirect_uris: ['https://example.com/callback#fragment'],
      }),
    ).toBeNull();
    expect(authentication.verifyAccessToken('access.changed')).toBeNull();
    await expect(
      authentication.exchangeToken({
        clientId: 'client',
        grantType: 'refresh_token',
        resource: 'https://frms.dev/mcp',
      }),
    ).resolves.toBeNull();
  });

  function createAuthentication(): McpAuthentication {
    return new McpAuthentication(
      'github-client-id',
      'github-client-secret',
      'a-secret-that-is-never-sent-to-the-client',
      'https://frms.dev',
    );
  }
});
