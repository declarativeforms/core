import {
  OAuthError,
  OAuthErrorCode,
  type AuthInfo,
  type OAuthClientInformationFull,
  type OAuthMetadata,
  type OAuthProtectedResourceMetadata,
  type OAuthTokens,
} from '@modelcontextprotocol/server';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { GitHubOAuthGateway } from '../gateways';
import type { IGitHubOAuthTokens } from '../types';
import { TokenService } from './token.service';

const ACCESS_TOKEN = 'dfr_access';
const AUTHORIZATION_CODE = 'dfr_code';
const AUTHORIZATION_STATE = 'dfr_state';
const CLIENT = 'dfr_client';
const REFRESH_TOKEN = 'dfr_refresh';
const SCOPE = 'mcp';
const ACCESS_TOKEN_LIFETIME = 8 * 60 * 60;
const AUTHORIZATION_CODE_LIFETIME = 5 * 60;
const AUTHORIZATION_STATE_LIFETIME = 10 * 60;
const REFRESH_TOKEN_LIFETIME = 15897600;

type AccessTokenPayload = {
  clientId: string;
  expiresAt?: number;
  githubToken: string;
  resource: string;
  scopes: string[];
};

type AuthorizationCodePayload = {
  clientId: string;
  codeChallenge: string;
  expiresAt?: number;
  githubCode: string;
  githubCodeVerifier: string;
  redirectUri: string;
  resource: string;
  scope: string;
};

type AuthorizationStatePayload = {
  clientId: string;
  clientState: string;
  codeChallenge: string;
  expiresAt?: number;
  githubCodeVerifier: string;
  redirectUri: string;
  resource: string;
  scope: string;
};

type ClientPayload = {
  clientName?: string;
  redirectUris: string[];
};

type RefreshTokenPayload = {
  clientId: string;
  expiresAt?: number;
  githubRefreshToken: string;
  resource: string;
  scope: string;
};

export type AuthorizationRequest = {
  clientId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  redirectUri?: string;
  resource?: string;
  responseType?: string;
  scope?: string;
  state?: string;
};

export type TokenRequest = {
  clientId?: string;
  code?: string;
  codeVerifier?: string;
  grantType?: string;
  redirectUri?: string;
  refreshToken?: string;
  resource?: string;
};

export class AuthenticationService {
  private issuer: string;
  private resource: string;
  private tokenService: TokenService;

  constructor(
    private gitHubOAuthGateway: GitHubOAuthGateway,
    secret: string,
    baseUrl: string,
  ) {
    const url = new URL(baseUrl);
    this.issuer = url.origin;
    this.resource = new URL('/mcp', this.issuer).toString();
    this.tokenService = new TokenService(secret);
  }

  public getOAuthMetadata(): OAuthMetadata {
    return {
      authorization_endpoint: new URL(
        '/oauth/authorize',
        this.issuer,
      ).toString(),
      authorization_response_iss_parameter_supported: true,
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      issuer: this.issuer,
      registration_endpoint: new URL(
        '/oauth/register',
        this.issuer,
      ).toString(),
      response_types_supported: ['code'],
      scopes_supported: [SCOPE],
      token_endpoint: new URL('/oauth/token', this.issuer).toString(),
      token_endpoint_auth_methods_supported: ['none'],
    };
  }

  public getProtectedResourceMetadata(): OAuthProtectedResourceMetadata {
    return {
      authorization_servers: [this.issuer],
      bearer_methods_supported: ['header'],
      resource: this.resource,
      resource_name: 'Declarative Forms',
      scopes_supported: [SCOPE],
    };
  }

  public getResourceMetadataUrl(): string {
    return new URL(
      '/.well-known/oauth-protected-resource/mcp',
      this.issuer,
    ).toString();
  }

  public registerClient(value: unknown): OAuthClientInformationFull | null {
    if (!isObject(value) || !Array.isArray(value.redirect_uris)) {
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
      !redirectUris.every(isValidRedirectUri)
    ) {
      return null;
    }

    if (
      value.token_endpoint_auth_method !== undefined &&
      value.token_endpoint_auth_method !== 'none'
    ) {
      return null;
    }

    if (
      value.grant_types !== undefined &&
      (!Array.isArray(value.grant_types) ||
        !value.grant_types.includes('authorization_code') ||
        value.grant_types.some((entry) => entry !== 'authorization_code'))
    ) {
      return null;
    }

    if (
      value.response_types !== undefined &&
      (!Array.isArray(value.response_types) ||
        !value.response_types.includes('code') ||
        value.response_types.some((entry) => entry !== 'code'))
    ) {
      return null;
    }

    if (
      (value.client_name !== undefined &&
        (typeof value.client_name !== 'string' ||
          value.client_name.length > 100)) ||
      (value.scope !== undefined &&
        (typeof value.scope !== 'string' || !isSupportedScope(value.scope)))
    ) {
      return null;
    }

    const clientName =
      typeof value.client_name === 'string' ? value.client_name : undefined;
    const clientId = this.tokenService.create<ClientPayload>(CLIENT, {
      clientName,
      redirectUris,
    });

    return {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: clientName,
      grant_types: ['authorization_code'],
      redirect_uris: redirectUris,
      response_types: ['code'],
      scope: SCOPE,
      token_endpoint_auth_method: 'none',
    };
  }

  public beginAuthorization(value: AuthorizationRequest): string | null {
    if (
      value.responseType !== 'code' ||
      !value.clientId ||
      !value.redirectUri ||
      !value.state ||
      value.state.length > 2048 ||
      value.codeChallengeMethod !== 'S256' ||
      !value.codeChallenge ||
      !/^[A-Za-z0-9_-]{43}$/.test(value.codeChallenge) ||
      value.resource !== this.resource ||
      !isSupportedScope(value.scope)
    ) {
      return null;
    }

    const client = this.tokenService.verify<ClientPayload>(
      CLIENT,
      value.clientId,
    );

    if (!client || !client.redirectUris.includes(value.redirectUri)) {
      return null;
    }

    const githubCodeVerifier = randomBytes(32).toString('base64url');
    const state = this.tokenService.create<AuthorizationStatePayload>(
      AUTHORIZATION_STATE,
      {
        clientId: value.clientId,
        clientState: value.state,
        codeChallenge: value.codeChallenge,
        githubCodeVerifier,
        redirectUri: value.redirectUri,
        resource: value.resource,
        scope: SCOPE,
      },
      AUTHORIZATION_STATE_LIFETIME,
    );

    return this.gitHubOAuthGateway.getAuthorizationUrl(
      state,
      createHash('sha256').update(githubCodeVerifier).digest('base64url'),
    );
  }

  public completeAuthorization(
    state: string,
    code?: string,
    error?: string,
  ): string | null {
    const value = this.tokenService.verify<AuthorizationStatePayload>(
      AUTHORIZATION_STATE,
      state,
    );

    if (!value) {
      return null;
    }

    const url = new URL(value.redirectUri);
    url.searchParams.set('state', value.clientState);
    url.searchParams.set('iss', this.issuer);

    if (error || !code) {
      url.searchParams.set('error', 'access_denied');
      return url.toString();
    }

    const authorizationCode =
      this.tokenService.create<AuthorizationCodePayload>(
        AUTHORIZATION_CODE,
        {
          clientId: value.clientId,
          codeChallenge: value.codeChallenge,
          githubCode: code,
          githubCodeVerifier: value.githubCodeVerifier,
          redirectUri: value.redirectUri,
          resource: value.resource,
          scope: value.scope,
        },
        AUTHORIZATION_CODE_LIFETIME,
      );

    url.searchParams.set('code', authorizationCode);
    return url.toString();
  }

  public async exchangeToken(value: TokenRequest): Promise<OAuthTokens | null> {
    if (value.grantType === 'authorization_code') {
      return this.exchangeAuthorizationCode(value);
    }

    if (value.grantType === 'refresh_token') {
      return this.refreshAccessToken(value);
    }

    return null;
  }

  public async verifyAccessToken(token: string): Promise<AuthInfo> {
    const value = this.tokenService.verify<AccessTokenPayload>(
      ACCESS_TOKEN,
      token,
    );

    if (
      !value ||
      value.resource !== this.resource ||
      !value.scopes.includes(SCOPE) ||
      !value.githubToken ||
      !value.clientId ||
      !value.expiresAt
    ) {
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid access token');
    }

    return {
      clientId: value.clientId,
      expiresAt: value.expiresAt,
      extra: { githubToken: value.githubToken },
      resource: new URL(value.resource),
      scopes: value.scopes,
      token,
    };
  }

  private async exchangeAuthorizationCode(
    value: TokenRequest,
  ): Promise<OAuthTokens | null> {
    if (
      !value.code ||
      !value.clientId ||
      !value.redirectUri ||
      !value.codeVerifier ||
      !isValidCodeVerifier(value.codeVerifier) ||
      value.resource !== this.resource
    ) {
      return null;
    }

    const authorizationCode =
      this.tokenService.verify<AuthorizationCodePayload>(
        AUTHORIZATION_CODE,
        value.code,
      );

    if (
      !authorizationCode ||
      authorizationCode.clientId !== value.clientId ||
      authorizationCode.redirectUri !== value.redirectUri ||
      authorizationCode.resource !== value.resource ||
      !matchesCodeChallenge(
        value.codeVerifier,
        authorizationCode.codeChallenge,
      )
    ) {
      return null;
    }

    const gitHubTokens =
      await this.gitHubOAuthGateway.exchangeAuthorizationCode(
        authorizationCode.githubCode,
        authorizationCode.githubCodeVerifier,
      );

    return gitHubTokens
      ? this.createTokens(
          gitHubTokens,
          value.clientId,
          value.resource,
          authorizationCode.scope,
        )
      : null;
  }

  private async refreshAccessToken(
    value: TokenRequest,
  ): Promise<OAuthTokens | null> {
    if (
      !value.refreshToken ||
      !value.clientId ||
      value.resource !== this.resource
    ) {
      return null;
    }

    const refreshToken = this.tokenService.verify<RefreshTokenPayload>(
      REFRESH_TOKEN,
      value.refreshToken,
    );

    if (
      !refreshToken ||
      refreshToken.clientId !== value.clientId ||
      refreshToken.resource !== value.resource
    ) {
      return null;
    }

    const gitHubTokens = await this.gitHubOAuthGateway.refreshAccessToken(
      refreshToken.githubRefreshToken,
    );

    return gitHubTokens
      ? this.createTokens(
          gitHubTokens,
          value.clientId,
          value.resource,
          refreshToken.scope,
        )
      : null;
  }

  private createTokens(
    gitHubTokens: IGitHubOAuthTokens,
    clientId: string,
    resource: string,
    scope: string,
  ): OAuthTokens {
    const expiresIn = validLifetime(
      gitHubTokens.expiresIn,
      ACCESS_TOKEN_LIFETIME,
    );
    const accessToken = this.tokenService.create<AccessTokenPayload>(
      ACCESS_TOKEN,
      {
        clientId,
        githubToken: gitHubTokens.accessToken,
        resource,
        scopes: [scope],
      },
      expiresIn,
    );

    if (!gitHubTokens.refreshToken) {
      return {
        access_token: accessToken,
        expires_in: expiresIn,
        scope,
        token_type: 'Bearer',
      };
    }

    const refreshToken = this.tokenService.create<RefreshTokenPayload>(
      REFRESH_TOKEN,
      {
        clientId,
        githubRefreshToken: gitHubTokens.refreshToken,
        resource,
        scope,
      },
      validLifetime(
        gitHubTokens.refreshTokenExpiresIn,
        REFRESH_TOKEN_LIFETIME,
      ),
    );

    return {
      access_token: accessToken,
      expires_in: expiresIn,
      refresh_token: refreshToken,
      scope,
      token_type: 'Bearer',
    };
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSupportedScope(scope: string | undefined): boolean {
  return !scope || scope.split(' ').filter(Boolean).every((entry) => entry === SCOPE);
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

    if (url.protocol === 'https:') {
      return true;
    }

    return (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function isValidCodeVerifier(value: string): boolean {
  return /^[A-Za-z0-9._~-]{43,128}$/.test(value);
}

function matchesCodeChallenge(verifier: string, challenge: string): boolean {
  const value = createHash('sha256').update(verifier).digest('base64url');
  const valueBuffer = Buffer.from(value);
  const challengeBuffer = Buffer.from(challenge);

  return (
    valueBuffer.length === challengeBuffer.length &&
    timingSafeEqual(valueBuffer, challengeBuffer)
  );
}

function validLifetime(value: number | undefined, fallback: number): number {
  return Number.isSafeInteger(value) && (value as number) > 0
    ? Math.min(value as number, fallback)
    : fallback;
}
