import type {
  Configuration,
  Interaction,
  InteractionResults,
  JWK,
  Provider as OAuthProvider,
} from 'oidc-provider';
import Provider, { errors } from 'oidc-provider';
import { createHash, randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Container } from '../core/container.js';
import { TokenService } from '../core/services/token.service.js';
import {
  createMongoOAuthAdapter,
  ensureOAuthArtifactIndexes,
} from './mongo-oauth-adapter.js';

const ACCESS_TOKEN_TTL_SECONDS = 3600;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const GITHUB_STATE_TTL_SECONDS = 600;
const OAUTH_PREFIX = '/api/v1/oauth';
const INTERACTION_PREFIX = '/api/v1/oauth-interaction';
const GITHUB_CALLBACK_PATH = '/api/v1/oauth-github/callback';

type GitHubState = {
  code_verifier: string;
  uid: string;
};

type ConsentDetails = {
  missingOIDCClaims?: Array<string>;
  missingOIDCScope?: Array<string>;
  missingResourceScopes?: Record<string, Array<string>>;
};

type ProviderCallback = ReturnType<OAuthProvider['callback']>;

function readRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function readRequiredSecret(name: string): string {
  const value = readRequiredEnvironment(name);

  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error(`${name} must be at least 32 bytes`);
  }

  return value;
}

function readJsonWebKeySet(): { keys: Array<JWK> } {
  const value = JSON.parse(readRequiredEnvironment('OAUTH_JWKS')) as {
    keys?: Array<JWK>;
  };

  if (!Array.isArray(value.keys) || value.keys.length === 0) {
    throw new Error('OAUTH_JWKS must contain at least one private key');
  }

  if (value.keys.some((key) => key.kty === 'oct')) {
    throw new Error('OAUTH_JWKS must contain only asymmetric keys');
  }

  return { keys: value.keys };
}

function readCookieKeys(): Array<string> {
  const keys = readRequiredEnvironment('OAUTH_COOKIE_KEYS')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (
    keys.length === 0 ||
    keys.some((key) => Buffer.byteLength(key, 'utf8') < 32)
  ) {
    throw new Error('OAUTH_COOKIE_KEYS must contain keys of at least 32 bytes');
  }

  return keys;
}

function buildPublicUrl(path: string): string {
  return `${readRequiredEnvironment('PUBLIC_BASE_URL').replace(/\/$/, '')}${path}`;
}

async function forwardProviderRequest(
  callback: ProviderCallback,
  providerPath: string,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const originalUrl = request.raw.url;
  request.raw.url = providerPath;
  reply.hijack();

  try {
    await callback(request.raw, reply.raw);
  } finally {
    request.raw.url = originalUrl;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character] || character;
  });
}

function renderConsent(clientName: string, scopes: Array<string>): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authorize Declarative Forms</title><style>body{font:16px system-ui;max-width:34rem;margin:10vh auto;padding:1.5rem;color:#18181b}main{border:1px solid #e4e4e7;border-radius:12px;padding:2rem}button{font:inherit;padding:.75rem 1rem;border-radius:8px;border:0;background:#18181b;color:white;cursor:pointer}.deny{background:transparent;color:#52525b;margin-left:.5rem}</style></head><body><main><h1>Authorize ${escapeHtml(clientName)}</h1><p>This connection can ${escapeHtml(scopes.join(', '))} in your personal Declarative Forms workspace.</p><form method="post"><button name="decision" value="allow">Allow</button><button class="deny" name="decision" value="deny">Cancel</button></form></main></body></html>`;
}

async function finishConsent(
  provider: OAuthProvider,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const interaction = await provider.interactionDetails(request.raw, reply.raw);

  if (interaction.prompt.name !== 'consent') {
    throw new Error('The OAuth interaction is not awaiting consent');
  }

  const body = request.body as { decision?: string };

  if (body.decision !== 'allow') {
    reply.hijack();
    await provider.interactionFinished(
      request.raw,
      reply.raw,
      { error: 'access_denied', error_description: 'Authorization declined' },
      { mergeWithLastSubmission: false },
    );

    return;
  }

  const details = interaction.prompt.details as ConsentDetails;
  const accountId = interaction.session?.accountId;
  const clientId = interaction.params.client_id;

  if (!accountId || typeof clientId !== 'string') {
    throw new Error('The OAuth interaction has no account or client');
  }

  let grant = interaction.grantId
    ? await provider.Grant.find(interaction.grantId)
    : new provider.Grant({ accountId, clientId });

  if (!grant) {
    throw new Error('The OAuth grant could not be loaded');
  }

  if (details.missingOIDCScope) {
    grant.addOIDCScope(details.missingOIDCScope.join(' '));
  }

  if (details.missingOIDCClaims) {
    grant.addOIDCClaims(details.missingOIDCClaims);
  }

  if (details.missingResourceScopes) {
    for (const [resource, scopes] of Object.entries(
      details.missingResourceScopes,
    )) {
      grant.addResourceScope(resource, scopes.join(' '));
    }
  }

  const grantId = await grant.save();
  const consent = interaction.grantId ? {} : { grantId };

  reply.hijack();
  await provider.interactionFinished(
    request.raw,
    reply.raw,
    { consent },
    { mergeWithLastSubmission: true },
  );
}

async function startGitHubLogin(
  provider: OAuthProvider,
  container: Container,
  stateTokens: TokenService,
  interaction: Interaction,
): Promise<string> {
  const codeVerifier = randomBytes(32).toString('base64url');
  const state = stateTokens.create<GitHubState>(
    'github-state',
    { code_verifier: codeVerifier, uid: interaction.uid },
    GITHUB_STATE_TTL_SECONDS,
  );

  return container.gitHubOAuthGateway.buildAuthorizationUrl(
    buildPublicUrl(GITHUB_CALLBACK_PATH),
    state,
    createHash('sha256').update(codeVerifier).digest('base64url'),
  );
}

function createProvider(container: Container): OAuthProvider {
  const issuer = buildPublicUrl(OAUTH_PREFIX);
  const resource = buildPublicUrl('/api/v1/mcp');
  const configuration: Configuration = {
    acceptQueryParamAccessTokens: false,
    adapter: createMongoOAuthAdapter(container.db),
    claims: {
      email: ['email', 'email_verified'],
      openid: ['sub'],
    },
    clientDefaults: {
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    },
    cookies: {
      keys: readCookieKeys(),
      long: { httpOnly: true, sameSite: 'lax', secure: true },
      short: {
        httpOnly: true,
        path: '/api/v1',
        sameSite: 'lax',
        secure: true,
      },
    },
    features: {
      devInteractions: { enabled: false },
      registration: { enabled: true, initialAccessToken: false },
      resourceIndicators: {
        defaultResource: () => resource,
        enabled: true,
        getResourceServerInfo: (_context, indicator) => {
          if (indicator !== resource) {
            throw new errors.InvalidTarget('Unknown resource');
          }

          return {
            accessTokenFormat: 'jwt',
            accessTokenTTL: ACCESS_TOKEN_TTL_SECONDS,
            audience: resource,
            scope: 'forms',
          };
        },
        useGrantedResource: () => true,
      },
      revocation: { enabled: true },
      userinfo: { enabled: true },
    },
    findAccount: async (_context, id) => {
      const account = await container.oauthAccountService.find(id);

      if (!account) {
        return undefined;
      }

      return {
        accountId: account.id,
        claims: () => ({
          email: account.email_address,
          email_verified: true,
          sub: account.id,
        }),
      };
    },
    interactions: {
      url: (_context, interaction) =>
        `${INTERACTION_PREFIX}/${interaction.uid}`,
    },
    jwks: readJsonWebKeySet(),
    issueRefreshToken: (_context, client) =>
      client.grantTypeAllowed('refresh_token'),
    pkce: { required: () => true },
    responseTypes: ['code'],
    rotateRefreshToken: true,
    scopes: ['openid', 'email', 'forms'],
    ttl: {
      AccessToken: ACCESS_TOKEN_TTL_SECONDS,
      RefreshToken: REFRESH_TOKEN_TTL_SECONDS,
    },
  };
  const provider = new Provider(issuer, configuration);

  provider.proxy = true;
  provider.on('server_error', (_context, error) => console.error(error));

  return provider;
}

export async function registerOAuth(
  server: FastifyInstance,
  container: Container,
): Promise<OAuthProvider> {
  await ensureOAuthArtifactIndexes(container.db);
  const provider = createProvider(container);
  const stateTokens = new TokenService(
    readRequiredSecret('OAUTH_STATE_SECRET'),
    'oauth-state',
  );

  server.get(
    `${INTERACTION_PREFIX}/:uid`,
    async (
      request: FastifyRequest<{ Params: { uid: string } }>,
      reply: FastifyReply,
    ): Promise<void> => {
      const interaction = await provider.interactionDetails(
        request.raw,
        reply.raw,
      );

      if (interaction.uid !== request.params.uid) {
        reply.status(400).send();

        return;
      }

      if (interaction.prompt.name === 'login') {
        reply.redirect(
          await startGitHubLogin(provider, container, stateTokens, interaction),
        );

        return;
      }

      if (interaction.prompt.name !== 'consent') {
        reply.status(400).send();

        return;
      }

      const clientId = interaction.params.client_id;
      const client =
        typeof clientId === 'string'
          ? await provider.Client.find(clientId)
          : undefined;
      const scopes = String(interaction.params.scope || '')
        .split(' ')
        .filter((scope) => scope && scope !== 'openid' && scope !== 'email');

      reply
        .header('cache-control', 'no-store')
        .type('text/html')
        .send(
          renderConsent(
            client?.clientName || client?.clientId || 'this application',
            scopes.length > 0 ? scopes : ['manage forms'],
          ),
        );
    },
  );

  server.post(
    `${INTERACTION_PREFIX}/:uid`,
    async (
      request: FastifyRequest<{ Params: { uid: string } }>,
      reply: FastifyReply,
    ): Promise<void> => {
      await finishConsent(provider, request, reply);
    },
  );

  server.get(
    GITHUB_CALLBACK_PATH,
    async (
      request: FastifyRequest<{
        Querystring: { code?: string; state?: string };
      }>,
      reply: FastifyReply,
    ): Promise<void> => {
      const state = stateTokens.verify<GitHubState>(
        'github-state',
        request.query.state || '',
      );

      if (!state || !request.query.code) {
        reply.status(400).send();

        return;
      }

      const interaction = await provider.interactionDetails(
        request.raw,
        reply.raw,
      );

      if (
        interaction.uid !== state.uid ||
        interaction.prompt.name !== 'login'
      ) {
        reply.status(400).send();

        return;
      }

      const tokens = await container.gitHubOAuthGateway.getAccessToken(
        buildPublicUrl(GITHUB_CALLBACK_PATH),
        request.query.code,
        state.code_verifier,
      );
      const user = tokens
        ? await container.gitHubOAuthGateway.findUser(tokens.accessToken)
        : null;

      if (!user) {
        reply.status(401).send();

        return;
      }

      const account = await container.oauthAccountService.connectGitHub(user);

      reply.hijack();
      await provider.interactionFinished(
        request.raw,
        reply.raw,
        {
          login: {
            accountId: account.id,
            amr: ['github'],
            remember: true,
          },
        },
        { mergeWithLastSubmission: false },
      );
    },
  );

  const callback = provider.callback();

  server.get(
    '/.well-known/oauth-authorization-server/api/v1/oauth',
    async (request, reply): Promise<void> => {
      await forwardProviderRequest(
        callback,
        '/.well-known/oauth-authorization-server',
        request,
        reply,
      );
    },
  );
  server.get(
    '/.well-known/openid-configuration/api/v1/oauth',
    async (request, reply): Promise<void> => {
      await forwardProviderRequest(
        callback,
        '/.well-known/openid-configuration',
        request,
        reply,
      );
    },
  );

  server.use(OAUTH_PREFIX, callback);

  return provider;
}
