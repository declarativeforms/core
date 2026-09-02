import { createHash, randomBytes } from 'node:crypto';
import { HttpError } from '../errors';
import type { AuthCodeRepository } from '../repositories';
import type { IOAuthProviderStrategy } from '../strategies';
import type { TokenService } from './token.service';

const STATE_TOKEN_TYPE = 'state';
const CODE_TOKEN_TYPE = 'code';
const STATE_TTL_SECONDS = 600;
const AUTH_CODE_TTL_SECONDS = 60;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

type AuthorizationState = {
  codeVerifier: string;
  nonce: string;
  provider: string;
  redirectUri: string;
};

type AuthorizationCode = {
  email: string;
  jti: string;
};

export class AuthenticationService {
  constructor(
    private authCodeRepository: AuthCodeRepository,
    private tokenService: TokenService,
    private strategies: Array<IOAuthProviderStrategy>,
  ) {}

  public async ensureIndexes(): Promise<void> {
    await this.authCodeRepository.ensureIndexes();
  }

  public isConfigured(): boolean {
    return !!process.env.AUTH_JWT_SECRET && !!process.env.AUTH_STATE_SECRET;
  }

  public accessTokenTtlSeconds(): number {
    const configured = Number.parseInt(
      process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS ||
        String(DEFAULT_ACCESS_TOKEN_TTL_SECONDS),
      10,
    );

    return Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  }

  public buildAuthorizationUrl(
    provider: string,
    redirectUri: string,
  ): string | null {
    const strategy = this.findStrategy(provider);

    if (!strategy) {
      return null;
    }

    if (!this.isAllowedRedirectUri(redirectUri)) {
      throw new HttpError(400, 'redirect_uri is not allowed');
    }

    const codeVerifier = randomBytes(32).toString('base64url');
    const state = this.tokenService.create<AuthorizationState>(
      STATE_TOKEN_TYPE,
      {
        codeVerifier,
        nonce: randomBytes(16).toString('base64url'),
        provider: strategy.type,
        redirectUri,
      },
      STATE_TTL_SECONDS,
    );

    return strategy.buildAuthorizationUrl(
      this.callbackUri(strategy.type),
      state,
      strategy.usesPkce
        ? createHash('sha256').update(codeVerifier).digest('base64url')
        : null,
    );
  }

  public async completeAuthorization(
    provider: string,
    code: string,
    state: string,
  ): Promise<string | null> {
    const strategy = this.findStrategy(provider);

    if (!strategy) {
      return null;
    }

    const payload = this.tokenService.verify<AuthorizationState>(
      STATE_TOKEN_TYPE,
      state,
    );

    if (
      !payload ||
      payload.provider !== strategy.type ||
      !this.isAllowedRedirectUri(payload.redirectUri)
    ) {
      return null;
    }

    const tokens = await strategy.exchangeAuthorizationCode(
      this.callbackUri(strategy.type),
      code,
      strategy.usesPkce ? payload.codeVerifier : null,
    );

    if (!tokens) {
      return null;
    }

    const email = await strategy.retrieveEmail(tokens.accessToken);

    if (!email) {
      return null;
    }

    const jti = randomBytes(32).toString('hex');

    await this.authCodeRepository.insert({
      expires_at: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
      id: jti,
    });

    const target = new URL(payload.redirectUri);
    target.searchParams.set(
      'auth_code',
      this.tokenService.create<AuthorizationCode>(
        CODE_TOKEN_TYPE,
        { email, jti },
        AUTH_CODE_TTL_SECONDS,
      ),
    );

    return target.toString();
  }

  public async consumeAuthCode(authCode: string): Promise<string | null> {
    const payload = this.tokenService.verify<AuthorizationCode>(
      CODE_TOKEN_TYPE,
      authCode,
    );

    if (!payload) {
      return null;
    }

    const consumed = await this.authCodeRepository.consume(payload.jti);

    return consumed ? payload.email : null;
  }

  private findStrategy(provider: string): IOAuthProviderStrategy | null {
    const strategy = this.strategies.find(
      (entry) => entry.type === provider.toLowerCase(),
    );

    return strategy && strategy.isConfigured() ? strategy : null;
  }

  private callbackUri(provider: string): string {
    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

    return `${base}/api/v1/auth/${provider}/callback`;
  }

  private isAllowedRedirectUri(value: string): boolean {
    const normalized = this.normalizeRedirectUri(value);

    return !!normalized && this.allowedRedirectUris().has(normalized);
  }

  private allowedRedirectUris(): Set<string> {
    const configured = (process.env.AUTH_ALLOWED_REDIRECT_URIS || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    const entries =
      configured.length > 0
        ? configured
        : [
            process.env.MANAGEMENT_BASE_URL ||
              process.env.PUBLIC_BASE_URL ||
              '',
          ];

    const result = new Set<string>();

    for (const entry of entries) {
      const normalized = this.normalizeRedirectUri(entry);

      if (normalized) {
        result.add(normalized);
      }
    }

    return result;
  }

  private normalizeRedirectUri(value: string): string | null {
    if (!value) {
      return null;
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      return null;
    }

    if (url.hash || url.username || url.password) {
      return null;
    }

    const isLocal = LOCAL_HOSTNAMES.includes(url.hostname);

    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
      return null;
    }

    return `${url.origin}${url.pathname}`;
  }
}
