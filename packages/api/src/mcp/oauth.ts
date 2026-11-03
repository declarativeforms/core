import type { FastifyInstance, FastifyRequest } from 'fastify';
import { OAuthStore, createToken, hashToken } from './oauth-store';

const CLIENT_ID = 'https://chatgpt.com/oauth/client.json';
const REDIRECT_URI = 'https://chatgpt.com/connector_platform_oauth_redirect';
const scopes = ['forms:read', 'forms:write'];

export type OAuthConfig = {
  origin: string;
  githubClientId: string;
  githubClientSecret: string;
};

function browserHash(request: FastifyRequest): string {
  const token = /(?:^|;\s*)__Host-mcp=([A-Za-z0-9_-]+)/.exec(
    request.headers.cookie ?? '',
  )?.[1];

  return token ? hashToken(token) : '';
}

export function registerOAuth(
  server: FastifyInstance,
  store: OAuthStore,
  config: OAuthConfig,
): void {
  const resource = `${config.origin}/mcp`;
  const callback = `${config.origin}/oauth/github/callback`;
  server.get('/.well-known/oauth-protected-resource', async () => ({
    resource,
    authorization_servers: [config.origin],
    scopes_supported: scopes,
  }));
  server.get('/.well-known/oauth-protected-resource/mcp', async () => ({
    resource,
    authorization_servers: [config.origin],
    scopes_supported: scopes,
  }));
  server.get('/.well-known/oauth-authorization-server', async () => ({
    issuer: config.origin,
    authorization_endpoint: `${config.origin}/oauth/authorize`,
    token_endpoint: `${config.origin}/oauth/token`,
    revocation_endpoint: `${config.origin}/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: scopes,
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
  }));

  server.get<{
    Querystring: {
      client_id: string;
      redirect_uri: string;
      resource: string;
      response_type: string;
      code_challenge: string;
      code_challenge_method: string;
      state: string;
      scope: string;
    };
  }>(
    '/oauth/authorize',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        querystring: {
          type: 'object',
          required: [
            'client_id',
            'redirect_uri',
            'resource',
            'response_type',
            'code_challenge',
            'code_challenge_method',
            'state',
          ],
          properties: {
            client_id: { type: 'string', const: CLIENT_ID },
            redirect_uri: { type: 'string', const: REDIRECT_URI },
            resource: { type: 'string', const: resource },
            response_type: { const: 'code', type: 'string' },
            code_challenge: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' },
            code_challenge_method: { type: 'string', const: 'S256' },
            state: { type: 'string', minLength: 1, maxLength: 2048 },
            scope: { type: 'string', default: 'forms:read forms:write' },
          },
        },
      },
    },
    async (request, reply) => {
      if (
        request.query.scope
          .split(' ')
          .some((scope) => !scopes.includes(scope)) ||
        !scopes.every((scope) => request.query.scope.split(' ').includes(scope))
      ) {
        return reply.code(400).send({ error: 'invalid_scope' });
      }
      const metadataResponse = await fetch(CLIENT_ID, {
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
      if (!metadataResponse.ok) {
        throw new Error('ChatGPT client metadata unavailable');
      }
      const metadata = (await metadataResponse.json()) as {
        client_id?: string;
        redirect_uris?: Array<string>;
      };
      if (
        metadata.client_id !== CLIENT_ID ||
        !metadata.redirect_uris?.includes(REDIRECT_URI)
      ) {
        throw new Error(
          'ChatGPT client metadata does not authorize the callback',
        );
      }
      const browser = createToken();
      const consent = await store.insertGrant('consent', {
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        resource,
        challenge: request.query.code_challenge,
        state: request.query.state,
        browserHash: hashToken(browser),
      });
      reply.header(
        'Set-Cookie',
        `__Host-mcp=${browser}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      );
      reply.header(
        'Content-Security-Policy',
        "default-src 'none'; form-action 'self'; frame-ancestors 'none'",
      );
      reply.header('Cache-Control', 'no-store');
      reply.header('Referrer-Policy', 'no-referrer');

      return reply
        .type('text/html')
        .send(
          `<!doctype html><html lang="en"><meta charset="utf-8"><title>Connect Declarative Forms</title><h1>Connect ChatGPT to Declarative Forms</h1><p>ChatGPT can list, read, create, and update your forms. Created forms are published immediately and anyone with the link can fill them out.</p><p>GitHub is used only to sign you in. Repository access is not requested.</p><form method="post" action="/oauth/authorize"><input type="hidden" name="consent" value="${consent}"><button>Continue with GitHub</button></form></html>`,
        );
    },
  );

  server.post<{ Body: { consent: string } }>(
    '/oauth/authorize',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['consent'],
          properties: {
            consent: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' },
          },
        },
      },
    },
    async (request, reply) => {
      if (request.headers.origin !== config.origin) {
        return reply.code(403).send();
      }
      const grant = await store.deleteGrant(
        request.body.consent,
        'consent',
        browserHash(request),
      );
      if (!grant) {
        return reply.code(400).send({ error: 'invalid_request' });
      }
      const verifier = createToken();
      const state = await store.insertGrant(
        'github',
        grant.authorization,
        '',
        verifier,
      );
      const url = new URL('https://github.com/login/oauth/authorize');
      url.search = new URLSearchParams({
        client_id: config.githubClientId,
        redirect_uri: callback,
        state,
        code_challenge: hashToken(verifier),
        code_challenge_method: 'S256',
      }).toString();

      return reply.redirect(url.toString());
    },
  );

  server.get<{ Querystring: { state: string; code?: string; error?: string } }>(
    '/oauth/github/callback',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        querystring: {
          type: 'object',
          required: ['state'],
          properties: {
            state: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' },
            code: { type: 'string', maxLength: 512 },
            error: { type: 'string', maxLength: 256 },
          },
        },
      },
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('Referrer-Policy', 'no-referrer');
      const grant = await store.deleteGrant(
        request.query.state,
        'github',
        browserHash(request),
      );
      if (!grant) {
        return reply.code(400).send({ error: 'invalid_request' });
      }
      const redirect = new URL(grant.authorization.redirectUri);
      redirect.search = new URLSearchParams({
        state: grant.authorization.state,
        iss: config.origin,
      }).toString();
      if (request.query.error || !request.query.code) {
        redirect.searchParams.set('error', 'access_denied');

        return reply.redirect(redirect.toString());
      }
      const exchange = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: config.githubClientId,
            client_secret: config.githubClientSecret,
            code: request.query.code,
            redirect_uri: callback,
            code_verifier: grant.verifier,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!exchange.ok) {
        throw new Error('GitHub token exchange unavailable');
      }
      const tokens = (await exchange.json()) as { access_token?: string };
      if (!tokens.access_token) {
        redirect.searchParams.set('error', 'access_denied');

        return reply.redirect(redirect.toString());
      }
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github+json',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!userResponse.ok) {
        throw new Error('GitHub identity unavailable');
      }
      const user = (await userResponse.json()) as { id?: number };
      if (!Number.isSafeInteger(user.id) || !user.id || user.id < 0) {
        throw new Error('Invalid GitHub identity');
      }
      const code = await store.insertGrant(
        'code',
        grant.authorization,
        String(user.id),
      );
      redirect.searchParams.set('code', code);
      reply.header(
        'Set-Cookie',
        '__Host-mcp=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      );

      return reply.redirect(redirect.toString());
    },
  );

  server.post<{
    Body: {
      grant_type: string;
      client_id: string;
      resource: string;
      code?: string;
      code_verifier?: string;
      redirect_uri?: string;
      refresh_token?: string;
    };
  }>(
    '/oauth/token',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['grant_type', 'client_id', 'resource'],
          properties: {
            grant_type: {
              type: 'string',
              enum: ['authorization_code', 'refresh_token'],
            },
            client_id: { type: 'string', const: CLIENT_ID },
            resource: { type: 'string', const: resource },
            code: { type: 'string', maxLength: 128 },
            code_verifier: {
              type: 'string',
              pattern: '^[A-Za-z0-9._~-]{43,128}$',
            },
            redirect_uri: { type: 'string', const: REDIRECT_URI },
            refresh_token: { type: 'string', maxLength: 128 },
          },
          allOf: [
            {
              if: {
                properties: { grant_type: { const: 'authorization_code' } },
              },
              then: { required: ['code', 'code_verifier', 'redirect_uri'] },
              else: { required: ['refresh_token'] },
            },
          ],
        },
      },
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('Pragma', 'no-cache');
      const body = request.body;
      if (body.grant_type === 'refresh_token') {
        const tokens = await store.rotateSession(
          body.refresh_token!,
          body.client_id,
          body.resource,
        );

        return tokens
          ? reply.send(tokens)
          : reply.code(400).send({ error: 'invalid_grant' });
      }
      const grant = await store.deleteCode(
        body.code!,
        body.client_id,
        body.redirect_uri!,
        body.resource,
        body.code_verifier!,
      );
      if (!grant) {
        return reply.code(400).send({ error: 'invalid_grant' });
      }

      return store.createSession(grant.ownerId, body.client_id, body.resource);
    },
  );

  server.post<{ Body: { token: string; client_id: string } }>(
    '/oauth/revoke',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['token', 'client_id'],
          properties: {
            token: { type: 'string', maxLength: 128 },
            client_id: { type: 'string', const: CLIENT_ID },
          },
        },
      },
    },
    async (request, reply) => {
      await store.revoke(request.body.token, request.body.client_id);

      return reply.code(200).send();
    },
  );
}
