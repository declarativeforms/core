import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const ACCESS_TOKEN_LIFETIME = 30 * 24 * 60 * 60;
const AUTHORIZATION_CODE_LIFETIME = 5 * 60;
const AUTHORIZATION_STATE_LIFETIME = 10 * 60;
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const SCOPE = 'forms:write';

type AccessToken = {
  clientId: string;
  githubToken: string;
  resource: string;
  scope: string;
};

type AuthorizationCode = {
  clientId: string;
  codeChallenge: string;
  githubCode: string;
  githubCodeVerifier: string;
  redirectUri: string;
  resource: string;
};

type AuthorizationRequest = {
  clientId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  redirectUri?: string;
  resource?: string;
  responseType?: string;
  scope?: string;
  state?: string;
};

type AuthorizationState = {
  clientId: string;
  clientState: string;
  codeChallenge: string;
  githubCodeVerifier: string;
  redirectUri: string;
  resource: string;
};

type Client = {
  applicationType?: 'native' | 'web';
  clientName?: string;
  issuer: string;
  redirectUris: string[];
};

type TokenPayload = {
  expiresAt?: number;
};

type TokenRequest = {
  clientId?: string;
  code?: string;
  codeVerifier?: string;
  grantType?: string;
  redirectUri?: string;
  resource?: string;
};

export class McpAuthentication {
  private callbackUrl: string;
  private issuer: string;
  private key: Buffer | null;
  private resource: string;

  constructor(
    private gitHubClientId: string,
    private gitHubClientSecret: string,
    secret: string,
    baseUrl = 'https://frms.dev',
  ) {
    this.issuer = new URL(baseUrl).origin;
    this.callbackUrl = new URL('/oauth/callback', this.issuer).toString();
    this.resource = new URL('/mcp', this.issuer).toString();
    this.key = secret
      ? createHash('sha256')
          .update('declarative-forms-mcp\0')
          .update(secret)
          .digest()
      : null;
  }

  public getAuthorizationServerMetadata() {
    return {
      authorization_endpoint: new URL(
        '/oauth/authorize',
        this.issuer,
      ).toString(),
      authorization_response_iss_parameter_supported: true,
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code'],
      issuer: this.issuer,
      registration_endpoint: new URL('/oauth/register', this.issuer).toString(),
      response_types_supported: ['code'],
      scopes_supported: [SCOPE],
      token_endpoint: new URL('/oauth/token', this.issuer).toString(),
      token_endpoint_auth_methods_supported: ['none'],
    };
  }

  public getProtectedResourceMetadata() {
    return {
      authorization_servers: [this.issuer],
      bearer_methods_supported: ['header'],
      resource: this.resource,
      resource_name: 'Declarative Forms',
      scopes_supported: [SCOPE],
    };
  }

  public getBearerChallenge(): string {
    const metadataUrl = new URL(
      '/.well-known/oauth-protected-resource/mcp',
      this.issuer,
    );

    return `Bearer resource_metadata="${metadataUrl}", scope="${SCOPE}"`;
  }

  public registerClient(value: unknown) {
    if (!this.key || !isObject(value) || !Array.isArray(value.redirect_uris)) {
      return null;
    }

    const redirectUris = value.redirect_uris;

    if (
      redirectUris.length === 0 ||
      redirectUris.length > 10 ||
      redirectUris.reduce(
        (length, redirectUri) =>
          length + (typeof redirectUri === 'string' ? redirectUri.length : 0),
        0,
      ) > 2048 ||
      !redirectUris.every(isValidRedirectUri) ||
      (value.token_endpoint_auth_method !== undefined &&
        value.token_endpoint_auth_method !== 'none') ||
      (value.response_types !== undefined &&
        (!Array.isArray(value.response_types) ||
          !value.response_types.includes('code'))) ||
      (value.grant_types !== undefined &&
        (!Array.isArray(value.grant_types) ||
          !value.grant_types.includes('authorization_code')))
    ) {
      return null;
    }

    const clientName =
      typeof value.client_name === 'string' ? value.client_name : undefined;
    const applicationType =
      value.application_type === 'native' || value.application_type === 'web'
        ? value.application_type
        : undefined;

    if (
      (value.client_name !== undefined &&
        (!clientName || clientName.length > 100)) ||
      (value.application_type !== undefined && !applicationType) ||
      (value.scope !== undefined && value.scope !== SCOPE)
    ) {
      return null;
    }

    const clientId = this.createToken<Client>('client', {
      applicationType,
      clientName,
      issuer: this.issuer,
      redirectUris,
    });

    return {
      ...(applicationType ? { application_type: applicationType } : {}),
      client_id: clientId,
      client_id_issued_at: now(),
      ...(clientName ? { client_name: clientName } : {}),
      grant_types: ['authorization_code'],
      redirect_uris: redirectUris,
      response_types: ['code'],
      scope: SCOPE,
      token_endpoint_auth_method: 'none',
    };
  }

  public beginAuthorization(value: AuthorizationRequest): string | null {
    if (
      !this.isConfigured() ||
      value.responseType !== 'code' ||
      !value.clientId ||
      !value.redirectUri ||
      !value.state ||
      value.state.length > 2048 ||
      value.codeChallengeMethod !== 'S256' ||
      !value.codeChallenge ||
      !/^[A-Za-z0-9_-]{43}$/.test(value.codeChallenge) ||
      value.resource !== this.resource ||
      (value.scope !== undefined && value.scope !== SCOPE)
    ) {
      return null;
    }

    const client = this.verifyToken<Client>('client', value.clientId);

    if (
      !client ||
      client.issuer !== this.issuer ||
      !client.redirectUris.includes(value.redirectUri)
    ) {
      return null;
    }

    const githubCodeVerifier = randomBytes(32).toString('base64url');
    const state = this.createToken<AuthorizationState>(
      'state',
      {
        clientId: value.clientId,
        clientState: value.state,
        codeChallenge: value.codeChallenge,
        githubCodeVerifier,
        redirectUri: value.redirectUri,
        resource: value.resource,
      },
      AUTHORIZATION_STATE_LIFETIME,
    );
    const url = new URL(GITHUB_AUTHORIZE_URL);
    url.searchParams.set('client_id', this.gitHubClientId);
    url.searchParams.set(
      'code_challenge',
      createHash('sha256').update(githubCodeVerifier).digest('base64url'),
    );
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('scope', 'public_repo');
    url.searchParams.set('state', state);

    return url.toString();
  }

  public completeAuthorization(
    state: string,
    code?: string,
    error?: string,
  ): string | null {
    const value = this.verifyToken<AuthorizationState>('state', state);

    if (!value) {
      return null;
    }

    const url = new URL(value.redirectUri);
    url.searchParams.set('iss', this.issuer);
    url.searchParams.set('state', value.clientState);

    if (error || !code) {
      url.searchParams.set('error', 'access_denied');
      return url.toString();
    }

    url.searchParams.set(
      'code',
      this.createToken<AuthorizationCode>(
        'code',
        {
          clientId: value.clientId,
          codeChallenge: value.codeChallenge,
          githubCode: code,
          githubCodeVerifier: value.githubCodeVerifier,
          redirectUri: value.redirectUri,
          resource: value.resource,
        },
        AUTHORIZATION_CODE_LIFETIME,
      ),
    );

    return url.toString();
  }

  public async exchangeToken(value: TokenRequest) {
    if (
      value.grantType !== 'authorization_code' ||
      !value.code ||
      !value.clientId ||
      !value.redirectUri ||
      !value.codeVerifier ||
      !isValidCodeVerifier(value.codeVerifier) ||
      value.resource !== this.resource
    ) {
      return null;
    }

    const client = this.verifyToken<Client>('client', value.clientId);
    const authorizationCode = this.verifyToken<AuthorizationCode>(
      'code',
      value.code,
    );

    if (
      !client ||
      !authorizationCode ||
      authorizationCode.clientId !== value.clientId ||
      authorizationCode.redirectUri !== value.redirectUri ||
      authorizationCode.resource !== value.resource ||
      !client.redirectUris.includes(value.redirectUri) ||
      !matchesCodeChallenge(value.codeVerifier, authorizationCode.codeChallenge)
    ) {
      return null;
    }

    const githubTokens = await this.exchangeGitHubCode(
      authorizationCode.githubCode,
      authorizationCode.githubCodeVerifier,
    );

    if (!githubTokens) {
      return null;
    }

    const expiresIn = validLifetime(
      githubTokens.expiresIn,
      ACCESS_TOKEN_LIFETIME,
    );

    return {
      access_token: this.createToken<AccessToken>(
        'access',
        {
          clientId: value.clientId,
          githubToken: githubTokens.accessToken,
          resource: value.resource,
          scope: SCOPE,
        },
        expiresIn,
      ),
      expires_in: expiresIn,
      scope: SCOPE,
      token_type: 'Bearer' as const,
    };
  }

  public verifyAccessToken(token: string): AccessToken | null {
    const value = this.verifyToken<AccessToken>('access', token);

    return value?.clientId &&
      value.githubToken &&
      value.resource === this.resource &&
      value.scope === SCOPE
      ? value
      : null;
  }

  private createToken<T>(type: string, value: T, expiresIn?: number): string {
    if (!this.key) {
      throw new Error('MCP authentication is not configured');
    }

    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(type));
    const payload = Buffer.from(
      JSON.stringify({
        ...value,
        ...(expiresIn ? { expiresAt: now() + expiresIn } : {}),
      }),
    );
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);

    return `${type}.${Buffer.concat([
      nonce,
      cipher.getAuthTag(),
      encrypted,
    ]).toString('base64url')}`;
  }

  private verifyToken<T>(
    type: string,
    token: string,
  ): (T & TokenPayload) | null {
    if (!this.key || !token.startsWith(`${type}.`)) {
      return null;
    }

    try {
      const encryptedToken = Buffer.from(
        token.slice(type.length + 1),
        'base64url',
      );

      if (encryptedToken.length <= NONCE_LENGTH + TAG_LENGTH) {
        return null;
      }

      const nonce = encryptedToken.subarray(0, NONCE_LENGTH);
      const tag = encryptedToken.subarray(
        NONCE_LENGTH,
        NONCE_LENGTH + TAG_LENGTH,
      );
      const encrypted = encryptedToken.subarray(NONCE_LENGTH + TAG_LENGTH);
      const decipher = createDecipheriv('aes-256-gcm', this.key, nonce);
      decipher.setAAD(Buffer.from(type));
      decipher.setAuthTag(tag);
      const payload = JSON.parse(
        Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
          'utf8',
        ),
      ) as T & TokenPayload;

      return payload.expiresAt !== undefined && payload.expiresAt <= now()
        ? null
        : payload;
    } catch {
      return null;
    }
  }

  private isConfigured(): boolean {
    return Boolean(this.key && this.gitHubClientId && this.gitHubClientSecret);
  }

  private async exchangeGitHubCode(
    code: string,
    codeVerifier: string,
  ): Promise<{ accessToken: string; expiresIn?: number } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.gitHubClientId,
        client_secret: this.gitHubClientSecret,
        code,
        code_verifier: codeVerifier,
        redirect_uri: this.callbackUrl,
      }).toString(),
      cache: 'no-store',
    });
    const value = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    return response.ok && value.access_token
      ? { accessToken: value.access_token, expiresIn: value.expires_in }
      : null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidRedirectUri(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);

    if (url.hash || url.username || url.password) {
      return false;
    }

    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    );
  } catch {
    return false;
  }
}

function isValidCodeVerifier(value: string): boolean {
  return /^[A-Za-z0-9._~-]{43,128}$/.test(value);
}

function matchesCodeChallenge(verifier: string, challenge: string): boolean {
  const value = Buffer.from(
    createHash('sha256').update(verifier).digest('base64url'),
  );
  const expected = Buffer.from(challenge);

  return value.length === expected.length && timingSafeEqual(value, expected);
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function validLifetime(value: number | undefined, fallback: number): number {
  return Number.isSafeInteger(value) && (value as number) > 0
    ? Math.min(value as number, fallback)
    : fallback;
}
